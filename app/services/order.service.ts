/**
 * Order Service (Extended)
 * 
 * Handles advanced order management including:
 * - Order state machine
 * - Partial shipments
 * - Order splits
 * - Manual order creation
 * - Refund workflows
 */

import { supabase } from '~/lib/supabase.client';
import { handleServiceError } from '~/utils/error-handler';

// =====================================================
// TYPES
// =====================================================

export interface OrderState {
  id: string;
  name: string;
  display_name: string;
  color?: string;
  is_terminal: boolean;
  is_cancellable: boolean;
}

export interface OrderStateTransition {
  id: string;
  from_state_id?: string;
  to_state_id: string;
  requires_permission?: string;
  requires_reauth: boolean;
  is_active: boolean;
}

export interface Shipment {
  id: string;
  order_id: string;
  warehouse_id?: string;
  tracking_number?: string;
  carrier?: string;
  shipped_at?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  status: string;
}

export interface RefundApproval {
  id: string;
  order_id: string;
  requested_amount: number;
  approved_amount?: number;
  requested_by: string;
  status: string;
  reason?: string;
  refund_method?: string;
}

// =====================================================
// ORDER STATE MANAGEMENT
// =====================================================

export async function getOrderStates(): Promise<OrderState[]> {
  try {
    const { data, error } = await supabase
      .from('order_states')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'getOrderStates');
  }
}

export async function getAvailableTransitions(
  currentStateId: string
): Promise<OrderStateTransition[]> {
  try {
    const { data, error } = await supabase
      .from('order_state_transitions')
      .select('*, to_state:order_states!to_state_id(*)')
      .eq('from_state_id', currentStateId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'getAvailableTransitions');
  }
}

export async function transitionOrderState(params: {
  orderId: string;
  fromState: string;
  toState: string;
  changedBy: string;
  reason?: string;
  notes?: string;
}): Promise<void> {
  try {
    // Log state history
    await supabase
      .from('order_state_history')
      .insert({
        order_id: params.orderId,
        from_state: params.fromState,
        to_state: params.toState,
        changed_by: params.changedBy,
        reason: params.reason,
        notes: params.notes,
      });

    // Update order current state
    const { error } = await supabase
      .from('orders')
      .update({ current_state: params.toState })
      .eq('id', params.orderId);

    if (error) throw error;
  } catch (error) {
    throw handleServiceError(error, 'transitionOrderState');
  }
}

export async function getOrderStateHistory(
  orderId: string
): Promise<Array<any>> {
  try {
    const { data, error } = await supabase
      .from('order_state_history')
      .select('*')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'getOrderStateHistory');
  }
}

// =====================================================
// SHIPMENT MANAGEMENT
// =====================================================

export async function createShipment(params: {
  orderId: string;
  warehouseId?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}): Promise<Shipment> {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .insert({
        order_id: params.orderId,
        warehouse_id: params.warehouseId,
        tracking_number: params.trackingNumber,
        carrier: params.carrier,
        estimated_delivery: params.estimatedDelivery,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleServiceError(error, 'createShipment');
  }
}

export async function addItemsToShipment(
  shipmentId: string,
  items: Array<{ orderItemId: string; quantity: number }>
): Promise<void> {
  try {
    const shipmentItems = items.map((item) => ({
      shipment_id: shipmentId,
      order_item_id: item.orderItemId,
      quantity: item.quantity,
    }));

    const { error } = await supabase
      .from('shipment_items')
      .insert(shipmentItems);

    if (error) throw error;
  } catch (error) {
    throw handleServiceError(error, 'addItemsToShipment');
  }
}

export async function markShipmentAsShipped(
  shipmentId: string,
  shippedAt?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('shipments')
      .update({
        status: 'shipped',
        shipped_at: shippedAt || new Date().toISOString(),
      })
      .eq('id', shipmentId);

    if (error) throw error;
  } catch (error) {
    throw handleServiceError(error, 'markShipmentAsShipped');
  }
}

export async function markShipmentAsDelivered(
  shipmentId: string,
  deliveredAt?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('shipments')
      .update({
        status: 'delivered',
        delivered_at: deliveredAt || new Date().toISOString(),
      })
      .eq('id', shipmentId);

    if (error) throw error;
  } catch (error) {
    throw handleServiceError(error, 'markShipmentAsDelivered');
  }
}

export async function getOrderShipments(orderId: string): Promise<Shipment[]> {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'getOrderShipments');
  }
}

// =====================================================
// REFUND WORKFLOW
// =====================================================

export async function requestRefund(params: {
  orderId: string;
  requestedAmount: number;
  requestedBy: string;
  reason?: string;
  refundMethod?: string;
}): Promise<RefundApproval> {
  try {
    const { data, error } = await supabase
      .from('refund_approvals')
      .insert({
        order_id: params.orderId,
        requested_amount: params.requestedAmount,
        requested_by: params.requestedBy,
        reason: params.reason,
        refund_method: params.refundMethod || 'original_payment',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleServiceError(error, 'requestRefund');
  }
}

export async function approveRefund(params: {
  refundId: string;
  approvedAmount: number;
  reviewedBy: string;
  reviewerNotes?: string;
}): Promise<void> {
  try {
    // Fetch refund + order context (needed for order lifecycle updates)
    const { data: refund, error: refundReadError } = await supabase
      .from('refund_approvals')
      .select('id, order_id, requested_amount, status, order:orders(id, current_state, status, payment_status)')
      .eq('id', params.refundId)
      .single();

    if (refundReadError) throw refundReadError;

    if (!refund) throw new Error('Refund request not found');

    const { error } = await supabase
      .from('refund_approvals')
      .update({
        approved_amount: params.approvedAmount,
        reviewed_by: params.reviewedBy,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: params.reviewerNotes,
        status: 'approved',
      })
      .eq('id', params.refundId);

    if (error) throw error;

    // Logical refund state change (no gateway integration)
    // Preserve history by inserting into order_state_history.
    const fromState = (refund as any)?.order?.current_state || (refund as any)?.order?.status || 'pending';
    const toState = 'refunded';

    await supabase
      .from('order_state_history')
      .insert({
        order_id: refund.order_id,
        from_state: fromState,
        to_state: toState,
        changed_by: params.reviewedBy,
        reason: 'refund_approved',
        notes: params.reviewerNotes,
        metadata: {
          refund_id: params.refundId,
          approved_amount: params.approvedAmount,
        },
      });

    // Keep legacy fields in sync for backward compatibility
    await supabase
      .from('orders')
      .update({
        current_state: toState,
        status: toState,
        payment_status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', refund.order_id);

    // Best-effort system activity log (if table exists)
    await supabase
      .from('system_activity_log')
      .insert({
        activity_type: 'refund_approved',
        entity_type: 'refund',
        entity_id: refund.id,
        actor_user_id: params.reviewedBy,
        activity_summary: `Refund approved for order ${refund.order_id}`,
        changes_snapshot: {
          refund_id: refund.id,
          approved_amount: params.approvedAmount,
        },
      })
      .then(() => null)
      .catch(() => null);
  } catch (error) {
    throw handleServiceError(error, 'approveRefund');
  }
}

export async function rejectRefund(params: {
  refundId: string;
  reviewedBy: string;
  reviewerNotes?: string;
}): Promise<void> {
  try {
    const { data: refund, error: refundReadError } = await supabase
      .from('refund_approvals')
      .select('id, order_id')
      .eq('id', params.refundId)
      .single();
    if (refundReadError) throw refundReadError;

    const { error } = await supabase
      .from('refund_approvals')
      .update({
        reviewed_by: params.reviewedBy,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: params.reviewerNotes,
        status: 'rejected',
      })
      .eq('id', params.refundId);

    if (error) throw error;

    await supabase
      .from('system_activity_log')
      .insert({
        activity_type: 'refund_rejected',
        entity_type: 'refund',
        entity_id: refund?.id,
        actor_user_id: params.reviewedBy,
        activity_summary: `Refund rejected for order ${refund?.order_id}`,
        changes_snapshot: {
          refund_id: refund?.id,
        },
      })
      .then(() => null)
      .catch(() => null);
  } catch (error) {
    throw handleServiceError(error, 'rejectRefund');
  }
}

export async function getPendingRefundRequests(): Promise<RefundApproval[]> {
  try {
    const { data, error } = await supabase
      .from('refund_approvals')
      .select('*, order:orders(*)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'getPendingRefundRequests');
  }
}

// =====================================================
// MANUAL ORDER CREATION
// =====================================================

export async function createManualOrder(params: {
  userId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: any;
  paymentMethod: string;
  notes?: string;
  createdBy: string;
}): Promise<any> {
  try {
    // Calculate totals
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: params.userId,
        total_amount: subtotal,
        payment_method: params.paymentMethod,
        shipping_address: params.shippingAddress,
        internal_notes: params.notes,
        source: 'manual',
        current_state: 'confirmed',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = params.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  } catch (error) {
    throw handleServiceError(error, 'createManualOrder');
  }
}

// =====================================================
// ORDER HOLDS
// =====================================================

export async function holdOrder(params: {
  orderId: string;
  reason: string;
  holdUntil?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        hold_reason: params.reason,
        hold_until: params.holdUntil,
        current_state: 'on_hold',
      })
      .eq('id', params.orderId);

    if (error) throw error;
  } catch (error) {
    throw handleServiceError(error, 'holdOrder');
  }
}

export async function releaseOrder(orderId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        hold_reason: null,
        hold_until: null,
        current_state: 'processing',
      })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    throw handleServiceError(error, 'releaseOrder');
  }
}
