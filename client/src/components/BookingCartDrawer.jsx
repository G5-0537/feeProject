import { ShoppingBag, X, Trash2, Clock, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { playChimeTone } from '../utils/audio.js';
import { triggerConfettiBurst } from '../utils/confetti.js';
import { useToast } from '../context/ToastContext.jsx';

/**
 * BookingCartDrawer Component
 * Interactive Slide-out Cart for Multi-Service Queue Bookings.
 * Maps to syllabus: "Mini project: shopping cart or dashboard".
 */
export default function BookingCartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, clearCart, totalDuration, totalPrice } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!customer) {
      toast.warning('Please log in as a customer to confirm your booking basket.');
      closeCart();
      navigate('/login');
      return;
    }

    if (items.length === 0) return;

    try {
      // First service or combined service entry
      const primaryService = items[0];
      const data = await apiRequest('/customer/queues/join', {
        method: 'POST',
        body: {
          business_id: Number(primaryService.business_id),
          service_id: Number(primaryService.service_id),
          service_notes: items.map(s => s.name).join(' + ')
        }
      });

      playChimeTone();
      triggerConfettiBurst();
      clearCart();
      closeCart();
      toast.success(`Booked ${items.length} service(s) successfully!`);
      navigate(`/customer/queue/${data.entry_id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to book queue entry.');
    }
  };

  return (
    <div className="cart-drawer-backdrop" onClick={closeCart}>
      <aside className="cart-drawer-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} className="text-teal" />
            <h3>Service Booking Basket</h3>
            <span className="cart-count-badge">{items.length}</span>
          </div>
          <button type="button" className="cart-close-btn" onClick={closeCart} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={48} className="cart-empty-icon" />
              <h4>Your basket is empty</h4>
              <p>Explore clinic and branch services to add multiple treatments or consultations to a single visit.</p>
            </div>
          ) : (
            <div className="cart-items-list">
              <div className="cart-branch-notice">
                <span>Branch:</span>
                <strong>{items[0].business_name}</strong>
              </div>

              {items.map((item) => (
                <div key={item.service_id} className="cart-item-row">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-duration">
                      <Clock size={12} /> ~{item.duration} mins
                    </span>
                  </div>
                  <div className="cart-item-actions">
                    {item.price > 0 && <span className="cart-item-price">₹{item.price}</span>}
                    <button
                      type="button"
                      className="cart-remove-item-btn"
                      onClick={() => removeFromCart(item.service_id)}
                      title="Remove item"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-row">
              <span>Total Estimated Duration:</span>
              <strong>~{totalDuration} mins</strong>
            </div>
            {totalPrice > 0 && (
              <div className="cart-summary-row">
                <span>Estimated Subtotal:</span>
                <strong className="text-teal">₹{totalPrice}</strong>
              </div>
            )}

            <div className="cart-actions-row">
              <button type="button" className="button ghost small" onClick={clearCart}>
                Clear All
              </button>
              <button type="button" className="button primary" onClick={handleCheckout}>
                <span>Confirm Queue Entry</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
