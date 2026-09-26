import { getDb, generateId, generateReference } from "./db";
import { getOperationPrefix } from "./utils";
import type Database from "better-sqlite3";

interface CreateOperationInput {
  type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  sourceLocationId?: string;
  destinationLocationId?: string;
  supplier?: string;
  customer?: string;
  scheduledAt?: string;
  responsibleId?: string;
  creatorId: string;
  notes?: string;
  lines: { productId: string; quantity: number; countedQuantity?: number; reason?: string }[];
}

export function createOperation(input: CreateOperationInput) {
  const db = getDb();

  // Validate type-specific constraints
  if (input.type === "RECEIPT" && !input.destinationLocationId) {
    throw new Error("Receipt requires a destination location");
  }
  if (input.type === "DELIVERY" && !input.sourceLocationId) {
    throw new Error("Delivery requires a source location");
  }
  if (input.type === "TRANSFER") {
    if (!input.sourceLocationId || !input.destinationLocationId) {
      throw new Error("Transfer requires both source and destination");
    }
    if (input.sourceLocationId === input.destinationLocationId) {
      throw new Error("Transfer source and destination must differ");
    }
  }
  if (input.type === "ADJUSTMENT" && !input.sourceLocationId) {
    throw new Error("Adjustment requires a location");
  }
  if (!input.lines || input.lines.length === 0) {
    throw new Error("At least one product line is required");
  }

  const operationId = generateId();
  const prefix = getOperationPrefix(input.type);
  
  const txn = db.transaction(() => {
    const reference = generateReference(db, prefix);
    
    db.prepare(`
      INSERT INTO operations (id, reference, type, status, source_location_id, destination_location_id,
        supplier, customer, scheduled_at, responsible_id, creator_id, notes)
      VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      operationId, reference, input.type,
      input.sourceLocationId || null,
      input.destinationLocationId || null,
      input.supplier || null,
      input.customer || null,
      input.scheduledAt || null,
      input.responsibleId || input.creatorId,
      input.creatorId,
      input.notes || null
    );

    for (const line of input.lines) {
      const lineId = generateId();
      
      // For adjustments, capture current balance snapshot
      let observedOnHand: number | null = null;
      let observedVersion: number | null = null;
      
      if (input.type === "ADJUSTMENT") {
        const locationId = input.sourceLocationId!;
        const balance = db.prepare(
          "SELECT on_hand, version FROM stock_balances WHERE product_id = ? AND location_id = ?"
        ).get(line.productId, locationId) as { on_hand: number; version: number } | undefined;
        
        observedOnHand = balance?.on_hand ?? 0;
        observedVersion = balance?.version ?? 0;
      }

      db.prepare(`
        INSERT INTO operation_lines (id, operation_id, product_id, quantity, counted_quantity, observed_on_hand, observed_version, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lineId, operationId, line.productId, line.quantity,
        line.countedQuantity ?? null,
        observedOnHand, observedVersion,
        line.reason || null
      );
    }

    return { id: operationId, reference };
  });

  return txn();
}

export function markReady(operationId: string, actorId: string) {
  const db = getDb();

  const txn = db.transaction(() => {
    const op = db.prepare("SELECT * FROM operations WHERE id = ?").get(operationId) as any;
    if (!op) throw new Error("Operation not found");
    if (op.status === "READY") return { status: "READY", message: "Already ready" };
    if (op.status === "DONE") throw new Error("Operation is already completed");
    if (op.status === "CANCELLED") throw new Error("Operation is cancelled");
    if (op.status !== "DRAFT" && op.status !== "WAITING") {
      throw new Error(`Cannot mark ready from status ${op.status}`);
    }

    const lines = db.prepare("SELECT * FROM operation_lines WHERE operation_id = ?").all(operationId) as any[];

    if (op.type === "RECEIPT") {
      // Receipts don't need reservation, just mark ready
      db.prepare("UPDATE operations SET status = 'READY', updated_at = datetime('now') WHERE id = ?").run(operationId);
      return { status: "READY" };
    }

    // For DELIVERY and TRANSFER, check and reserve stock
    const locationId = op.source_location_id;
    if (!locationId) throw new Error("Source location is required");

    // Sort lines by product_id for deterministic locking
    const sortedLines = [...lines].sort((a, b) => a.product_id.localeCompare(b.product_id));
    const shortages: { productId: string; productName: string; requested: number; available: number }[] = [];

    for (const line of sortedLines) {
      // Ensure balance row exists
      db.prepare(`
        INSERT OR IGNORE INTO stock_balances (product_id, location_id, on_hand, reserved, version)
        VALUES (?, ?, 0, 0, 1)
      `).run(line.product_id, locationId);

      const balance = db.prepare(
        "SELECT on_hand, reserved, version FROM stock_balances WHERE product_id = ? AND location_id = ?"
      ).get(line.product_id, locationId) as { on_hand: number; reserved: number; version: number };

      const free = balance.on_hand - balance.reserved;
      if (free < line.quantity) {
        const product = db.prepare("SELECT name FROM products WHERE id = ?").get(line.product_id) as { name: string };
        shortages.push({
          productId: line.product_id,
          productName: product.name,
          requested: line.quantity,
          available: free
        });
      }
    }

    if (shortages.length > 0) {
      db.prepare("UPDATE operations SET status = 'WAITING', updated_at = datetime('now') WHERE id = ?").run(operationId);
      return { status: "WAITING", shortages };
    }

    // Reserve stock
    for (const line of sortedLines) {
      db.prepare(`
        UPDATE stock_balances SET reserved = reserved + ?, version = version + 1
        WHERE product_id = ? AND location_id = ?
      `).run(line.quantity, line.product_id, locationId);

      db.prepare(`
        INSERT INTO reservation_lines (id, operation_line_id, product_id, location_id, quantity)
        VALUES (?, ?, ?, ?, ?)
      `).run(generateId(), line.id, line.product_id, locationId, line.quantity);
    }

    db.prepare("UPDATE operations SET status = 'READY', updated_at = datetime('now') WHERE id = ?").run(operationId);
    return { status: "READY" };
  });

  return txn();
}

export function completeOperation(operationId: string, actorId: string) {
  const db = getDb();

  const txn = db.transaction(() => {
    const op = db.prepare("SELECT * FROM operations WHERE id = ?").get(operationId) as any;
    if (!op) throw new Error("Operation not found");
    if (op.status === "DONE") return { status: "DONE", message: "Already completed" };
    if (op.status !== "READY") throw new Error(`Cannot complete from status ${op.status}`);

    const lines = db.prepare("SELECT * FROM operation_lines WHERE operation_id = ?").all(operationId) as any[];
    const sortedLines = [...lines].sort((a, b) => a.product_id.localeCompare(b.product_id));

    if (op.type === "RECEIPT") {
      return completeReceipt(db, op, sortedLines, actorId);
    } else if (op.type === "DELIVERY") {
      return completeDelivery(db, op, sortedLines, actorId);
    } else if (op.type === "TRANSFER") {
      return completeTransfer(db, op, sortedLines, actorId);
    } else if (op.type === "ADJUSTMENT") {
      return completeAdjustment(db, op, sortedLines, actorId);
    }

    throw new Error("Unknown operation type");
  });

  return txn();
}

function completeReceipt(db: Database.Database, op: any, lines: any[], actorId: string) {
  const locationId = op.destination_location_id;

  for (const line of lines) {
    // Ensure balance exists
    db.prepare(`
      INSERT OR IGNORE INTO stock_balances (product_id, location_id, on_hand, reserved, version)
      VALUES (?, ?, 0, 0, 1)
    `).run(line.product_id, locationId);

    // Insert movement
    db.prepare(`
      INSERT INTO stock_movements (id, operation_line_id, product_id, location_id, delta, leg, actor_id)
      VALUES (?, ?, ?, ?, ?, 'IN', ?)
    `).run(generateId(), line.id, line.product_id, locationId, line.quantity, actorId);

    // Increase on_hand
    db.prepare(`
      UPDATE stock_balances SET on_hand = on_hand + ?, version = version + 1
      WHERE product_id = ? AND location_id = ?
    `).run(line.quantity, line.product_id, locationId);
  }

  db.prepare(`
    UPDATE operations SET status = 'DONE', posted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).run(op.id);

  return { status: "DONE" };
}

function completeDelivery(db: Database.Database, op: any, lines: any[], actorId: string) {
  const locationId = op.source_location_id;

  for (const line of lines) {
    // Verify reservation
    const reservation = db.prepare(
      "SELECT * FROM reservation_lines WHERE operation_line_id = ?"
    ).get(line.id) as any;

    if (!reservation || reservation.quantity !== line.quantity) {
      throw new Error("Reservation mismatch for line " + line.id);
    }

    // Insert negative movement
    db.prepare(`
      INSERT INTO stock_movements (id, operation_line_id, product_id, location_id, delta, leg, actor_id)
      VALUES (?, ?, ?, ?, ?, 'OUT', ?)
    `).run(generateId(), line.id, line.product_id, locationId, -line.quantity, actorId);

    // Decrease on_hand and reserved
    db.prepare(`
      UPDATE stock_balances SET on_hand = on_hand - ?, reserved = reserved - ?, version = version + 1
      WHERE product_id = ? AND location_id = ?
    `).run(line.quantity, line.quantity, line.product_id, locationId);

    // Remove reservation
    db.prepare("DELETE FROM reservation_lines WHERE operation_line_id = ?").run(line.id);
  }

  db.prepare(`
    UPDATE operations SET status = 'DONE', posted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).run(op.id);

  return { status: "DONE" };
}

function completeTransfer(db: Database.Database, op: any, lines: any[], actorId: string) {
  const srcLocationId = op.source_location_id;
  const dstLocationId = op.destination_location_id;

  for (const line of lines) {
    // Verify reservation
    const reservation = db.prepare(
      "SELECT * FROM reservation_lines WHERE operation_line_id = ?"
    ).get(line.id) as any;

    if (!reservation || reservation.quantity !== line.quantity) {
      throw new Error("Reservation mismatch");
    }

    // Source: negative movement
    db.prepare(`
      INSERT INTO stock_movements (id, operation_line_id, product_id, location_id, delta, leg, actor_id)
      VALUES (?, ?, ?, ?, ?, 'OUT', ?)
    `).run(generateId(), line.id, line.product_id, srcLocationId, -line.quantity, actorId);

    // Destination: positive movement (use a composite leg key)
    db.prepare(`
      INSERT INTO stock_movements (id, operation_line_id, product_id, location_id, delta, leg, actor_id)
      VALUES (?, ?, ?, ?, ?, 'IN', ?)
    `).run(generateId(), line.id, line.product_id, dstLocationId, line.quantity, actorId);

    // Update source balance
    db.prepare(`
      UPDATE stock_balances SET on_hand = on_hand - ?, reserved = reserved - ?, version = version + 1
      WHERE product_id = ? AND location_id = ?
    `).run(line.quantity, line.quantity, line.product_id, srcLocationId);

    // Ensure destination balance exists and update
    db.prepare(`
      INSERT OR IGNORE INTO stock_balances (product_id, location_id, on_hand, reserved, version)
      VALUES (?, ?, 0, 0, 1)
    `).run(line.product_id, dstLocationId);

    db.prepare(`
      UPDATE stock_balances SET on_hand = on_hand + ?, version = version + 1
      WHERE product_id = ? AND location_id = ?
    `).run(line.quantity, line.product_id, dstLocationId);

    // Remove reservation
    db.prepare("DELETE FROM reservation_lines WHERE operation_line_id = ?").run(line.id);
  }

  db.prepare(`
    UPDATE operations SET status = 'DONE', posted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).run(op.id);

  return { status: "DONE" };
}

function completeAdjustment(db: Database.Database, op: any, lines: any[], actorId: string) {
  const locationId = op.source_location_id;

  for (const line of lines) {
    if (line.counted_quantity === null || line.counted_quantity === undefined) {
      throw new Error("Counted quantity is required for adjustment");
    }
    if (!line.reason) {
      throw new Error("Reason is required for adjustment");
    }

    // Ensure balance exists
    db.prepare(`
      INSERT OR IGNORE INTO stock_balances (product_id, location_id, on_hand, reserved, version)
      VALUES (?, ?, 0, 0, 1)
    `).run(line.product_id, locationId);

    const balance = db.prepare(
      "SELECT on_hand, reserved, version FROM stock_balances WHERE product_id = ? AND location_id = ?"
    ).get(line.product_id, locationId) as { on_hand: number; reserved: number; version: number };

    // Stale count check
    if (line.observed_version !== null && line.observed_version !== balance.version) {
      throw new Error("STALE_COUNT: Balance has changed since the count was recorded. Please review and recount.");
    }

    const countedQty = line.counted_quantity;
    
    // Check counted >= reserved
    if (countedQty < balance.reserved) {
      throw new Error(`Cannot count ${countedQty} when ${balance.reserved} is reserved. Resolve reservations first.`);
    }

    const delta = countedQty - balance.on_hand;

    // Skip zero delta
    if (delta !== 0) {
      db.prepare(`
        INSERT INTO stock_movements (id, operation_line_id, product_id, location_id, delta, leg, actor_id)
        VALUES (?, ?, ?, ?, ?, 'ADJUST', ?)
      `).run(generateId(), line.id, line.product_id, locationId, delta, actorId);
    }

    // Set on_hand to counted value
    db.prepare(`
      UPDATE stock_balances SET on_hand = ?, version = version + 1
      WHERE product_id = ? AND location_id = ?
    `).run(countedQty, line.product_id, locationId);
  }

  db.prepare(`
    UPDATE operations SET status = 'DONE', posted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).run(op.id);

  return { status: "DONE" };
}

export function cancelOperation(operationId: string, actorId: string) {
  const db = getDb();

  const txn = db.transaction(() => {
    const op = db.prepare("SELECT * FROM operations WHERE id = ?").get(operationId) as any;
    if (!op) throw new Error("Operation not found");
    if (op.status === "CANCELLED") return { status: "CANCELLED", message: "Already cancelled" };
    if (op.status === "DONE") throw new Error("Cannot cancel a completed operation");

    // If READY outgoing, release reservations
    if (op.status === "READY" && (op.type === "DELIVERY" || op.type === "TRANSFER")) {
      const lines = db.prepare("SELECT * FROM operation_lines WHERE operation_id = ?").all(operationId) as any[];
      
      for (const line of lines) {
        const reservation = db.prepare(
          "SELECT * FROM reservation_lines WHERE operation_line_id = ?"
        ).get(line.id) as any;

        if (reservation) {
          db.prepare(`
            UPDATE stock_balances SET reserved = reserved - ?, version = version + 1
            WHERE product_id = ? AND location_id = ?
          `).run(reservation.quantity, reservation.product_id, reservation.location_id);

          db.prepare("DELETE FROM reservation_lines WHERE operation_line_id = ?").run(line.id);
        }
      }
    }

    db.prepare("UPDATE operations SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?").run(operationId);
    return { status: "CANCELLED" };
  });

  return txn();
}

export function updateOperation(operationId: string, input: Partial<CreateOperationInput>) {
  const db = getDb();

  const txn = db.transaction(() => {
    const op = db.prepare("SELECT * FROM operations WHERE id = ?").get(operationId) as any;
    if (!op) throw new Error("Operation not found");
    if (op.status === "DONE" || op.status === "CANCELLED") {
      throw new Error(`Cannot edit a ${op.status.toLowerCase()} operation`);
    }
    if (op.status === "READY") {
      throw new Error("Return to Draft before editing");
    }

    // Update fields
    const updates: string[] = [];
    const values: any[] = [];

    if (input.supplier !== undefined) { updates.push("supplier = ?"); values.push(input.supplier || null); }
    if (input.customer !== undefined) { updates.push("customer = ?"); values.push(input.customer || null); }
    if (input.sourceLocationId !== undefined) { updates.push("source_location_id = ?"); values.push(input.sourceLocationId || null); }
    if (input.destinationLocationId !== undefined) { updates.push("destination_location_id = ?"); values.push(input.destinationLocationId || null); }
    if (input.scheduledAt !== undefined) { updates.push("scheduled_at = ?"); values.push(input.scheduledAt || null); }
    if (input.notes !== undefined) { updates.push("notes = ?"); values.push(input.notes || null); }
    if (input.responsibleId !== undefined) { updates.push("responsible_id = ?"); values.push(input.responsibleId || null); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      db.prepare(`UPDATE operations SET ${updates.join(", ")} WHERE id = ?`).run(...values, operationId);
    }

    // Update lines if provided
    if (input.lines) {
      db.prepare("DELETE FROM operation_lines WHERE operation_id = ?").run(operationId);

      for (const line of input.lines) {
        const lineId = generateId();
        
        let observedOnHand: number | null = null;
        let observedVersion: number | null = null;
        
        if (op.type === "ADJUSTMENT" && input.sourceLocationId) {
          const balance = db.prepare(
            "SELECT on_hand, version FROM stock_balances WHERE product_id = ? AND location_id = ?"
          ).get(line.productId, input.sourceLocationId) as any;
          observedOnHand = balance?.on_hand ?? 0;
          observedVersion = balance?.version ?? 0;
        }

        db.prepare(`
          INSERT INTO operation_lines (id, operation_id, product_id, quantity, counted_quantity, observed_on_hand, observed_version, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          lineId, operationId, line.productId, line.quantity,
          line.countedQuantity ?? null,
          observedOnHand, observedVersion,
          line.reason || null
        );
      }
    }

    return { status: op.status };
  });

  return txn();
}
