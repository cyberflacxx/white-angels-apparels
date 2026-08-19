import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faMobileScreenButton, faMoneyBillWave, faStore, faTruck } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EcoCashIdentity, EcoCashWordmark } from "../components/EcoCashIdentity";
import { Hero } from "../components/Hero";
import { AppButton, AppLink, Container, EmptyState, Field, Section, SelectField } from "../components/UI";
import { useCart } from "../context/CartContext";
import { api, extractApiError } from "../lib/api";
import { resolveMediaUrl } from "../lib/media";
import { useSiteSettings } from "./hooks";

type CheckoutFormState = {
  fullName: string;
  phone: string;
  addressLine1: string;
  cityArea: string;
  ecocashPayerName: string;
};

type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState | "paymentProof" | "location" | "form", string>>;

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [fulfilmentMethod, setFulfilment] = useState<"HOME_DELIVERY" | "SHOP_COLLECTION">("HOME_DELIVERY");
  const [paymentMethod, setPayment] = useState<"ECOCASH" | "CASH">("ECOCASH");
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    phone: "",
    addressLine1: "",
    cityArea: "",
    ecocashPayerName: ""
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CheckoutFormErrors>({});
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [sharingLocation, setSharingLocation] = useState(false);
  const deliveryFee = fulfilmentMethod === "HOME_DELIVERY" ? Number(settings.defaultDeliveryFee ?? 5) : 0;
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  function updateField<Key extends keyof CheckoutFormState>(key: Key, value: CheckoutFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setError("");
  }

  function validateForm() {
    const nextErrors: CheckoutFormErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Please enter your full name.";
    if (!form.phone.trim()) nextErrors.phone = "Please enter your phone number.";
    if (fulfilmentMethod === "HOME_DELIVERY") {
      if (!form.addressLine1.trim()) nextErrors.addressLine1 = "Please enter your delivery address.";
      if (!form.cityArea.trim()) nextErrors.cityArea = "Please enter your city, town, or area.";
    }
    if (paymentMethod === "ECOCASH") {
      if (!form.ecocashPayerName.trim()) nextErrors.ecocashPayerName = "Enter the name used for the EcoCash payment.";
      if (!paymentProof) nextErrors.paymentProof = "Please upload the EcoCash payment screenshot.";
    }

    return nextErrors;
  }

  async function placeOrder() {
    const nextErrors = validateForm();
    setFieldErrors(nextErrors);
    setError("");

    if (Object.keys(nextErrors).length > 0 || placing || !items.length) return;

    setError("");
    setPlacing(true);
    try {
      const payload = {
        customer: { fullName: form.fullName.trim(), phone: form.phone.trim() },
        fulfilmentMethod,
        deliveryAddress: fulfilmentMethod === "HOME_DELIVERY"
          ? {
              addressLine1: form.addressLine1.trim(),
              cityArea: form.cityArea.trim(),
              deliveryLatitude: location?.latitude,
              deliveryLongitude: location?.longitude
            }
          : undefined,
        paymentMethod,
        payment: paymentMethod === "ECOCASH"
          ? {
              ecocashPayerName: form.ecocashPayerName.trim()
            }
          : undefined,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      };
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      if (paymentProof) {
        formData.append("paymentProof", paymentProof);
      }

      const response = await api.post("/orders", formData);
      clearCart();
      navigate(`/order-success/${response.data.order_number}`);
    } catch (requestError) {
      const summary = extractApiError(requestError, "Your order could not be placed. Please try again.");
      setFieldErrors((current) => ({ ...current, ...summary.fieldErrors }));
      setError(summary.message);
    } finally {
      setPlacing(false);
    }
  }

  function shareCurrentLocation() {
    if (!navigator.geolocation) {
      setFieldErrors((current) => ({
        ...current,
        location: "Location sharing is not supported on this device. Please enter your delivery address."
      }));
      setLocationMessage("");
      return;
    }

    setSharingLocation(true);
    setFieldErrors((current) => ({ ...current, location: undefined }));
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        });
        setLocationMessage("Location shared successfully.");
        setSharingLocation(false);
      },
      (geoError) => {
        const message = geoError.code === geoError.PERMISSION_DENIED
          ? "Location access was not allowed. Please enable location permission or enter your delivery address."
          : geoError.code === geoError.POSITION_UNAVAILABLE
            ? "Your current location could not be detected. Please try again."
            : geoError.code === geoError.TIMEOUT
              ? "Location request timed out. Please try again."
              : "Your current location could not be detected. Please try again.";

        setFieldErrors((current) => ({ ...current, location: message }));
        setLocationMessage("");
        setSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  function handleProofSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPaymentProof(file);
    setFieldErrors((current) => ({ ...current, paymentProof: undefined, form: undefined }));
  }

  const locationUrl = location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : "";

  return (
    <main>
      <Hero className="hero--checkout" title="Complete your order." subtitle="Simple customer details, fulfilment, payment, and review." image={settings.heroCheckout} compact />
      <Section>
        <Container className="checkout-grid">
          <div className="checkout-flow">
            {!items.length && <EmptyState title="Your cart is empty" copy="Add products before checking out." action={<AppLink to="/shop">Shop Now</AppLink>} />}
            <Step number="1" title="Customer Details">
              <div className="form-grid">
                <Field
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  error={fieldErrors.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  required
                />
                <Field
                  label="Phone Number"
                  placeholder="e.g. 0786870610"
                  value={form.phone}
                  error={fieldErrors.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  required
                />
              </div>
            </Step>
            <Step number="2" title="Receive Your Order">
              <SelectField
                label="Delivery Method"
                value={fulfilmentMethod}
                helper="Choose how you want to receive this order."
                onChange={(event) => setFulfilment(event.target.value as "HOME_DELIVERY" | "SHOP_COLLECTION")}
              >
                <option value="HOME_DELIVERY">Home Delivery</option>
                <option value="SHOP_COLLECTION">Shop Collection</option>
              </SelectField>
              <div className="choice-grid">
                <Choice selected={fulfilmentMethod === "HOME_DELIVERY"} icon={faTruck} title="Home Delivery" copy="Send this order to your address." onClick={() => setFulfilment("HOME_DELIVERY")} />
                <Choice selected={fulfilmentMethod === "SHOP_COLLECTION"} icon={faStore} title="Shop Collection" copy={settings.collectionInstructions} onClick={() => setFulfilment("SHOP_COLLECTION")} />
              </div>
              {fulfilmentMethod === "HOME_DELIVERY" && (
                <div className="form-grid">
                  <Field
                    label="Address"
                    className="span-2"
                    placeholder="Enter house number and street"
                    value={form.addressLine1}
                    error={fieldErrors.addressLine1}
                    onChange={(event) => updateField("addressLine1", event.target.value)}
                  />
                  <Field
                    label="City / Town / Area"
                    className="span-2"
                    placeholder="e.g. Mutare, Dangamvura Area 16"
                    value={form.cityArea}
                    error={fieldErrors.cityArea}
                    onChange={(event) => updateField("cityArea", event.target.value)}
                  />
                  <div className="checkout-location-card span-2">
                    <div>
                      <strong>Share Current Location</strong>
                      <p>Add your current map location to help White Angels find the exact delivery point.</p>
                    </div>
                    <AppButton
                      type="button"
                      variant="secondary"
                      icon={faLocationDot}
                      className="checkout-location-button"
                      disabled={sharingLocation}
                      onClick={shareCurrentLocation}
                    >
                      {sharingLocation ? "Sharing..." : "Share Current Location"}
                    </AppButton>
                    {locationMessage ? <div className="status-banner checkout-location-feedback">{locationMessage}</div> : null}
                    {fieldErrors.location ? <div className="error-card checkout-location-feedback">{fieldErrors.location}</div> : null}
                    {location ? (
                      <div className="checkout-location-result">
                        <span>Location added ✓</span>
                        <small>Latitude: {location.latitude} | Longitude: {location.longitude}</small>
                        <a href={locationUrl} target="_blank" rel="noreferrer">View location</a>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </Step>
            <Step number="3" title="Payment">
              <SelectField
                label="Payment Method"
                value={paymentMethod}
                helper="Choose how you will pay for this order."
                onChange={(event) => setPayment(event.target.value as "ECOCASH" | "CASH")}
              >
                <option value="ECOCASH">EcoCash</option>
                <option value="CASH">Cash</option>
              </SelectField>
              <div className="choice-grid">
                <Choice selected={paymentMethod === "ECOCASH"} icon={faMobileScreenButton} title={<EcoCashWordmark />} copy="Submit details for manual verification." onClick={() => setPayment("ECOCASH")} />
                <Choice selected={paymentMethod === "CASH"} icon={faMoneyBillWave} title={fulfilmentMethod === "HOME_DELIVERY" ? "Cash on Delivery" : "Cash on Collection"} copy="Pay when receiving the order." onClick={() => setPayment("CASH")} />
              </div>
              {paymentMethod === "ECOCASH" && (
                <div className="checkout-ecocash-panel">
                  <EcoCashIdentity
                    className="payment-method-card payment-method-card--checkout"
                  />
                  <div className="form-grid">
                    <Field
                      className="span-2"
                      label="Name Used for EcoCash Payment"
                      helper="Enter the name shown on the EcoCash account used to make the payment."
                      placeholder="e.g. Genius Musonza"
                      value={form.ecocashPayerName}
                      error={fieldErrors.ecocashPayerName}
                      onChange={(event) => updateField("ecocashPayerName", event.target.value)}
                    />
                    <label className="field span-2">
                      <span className="field__label">Upload EcoCash Payment Screenshot</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProofSelection} />
                      <span className="field__helper">Attach a clear screenshot showing the completed EcoCash payment.</span>
                      {paymentProof ? <span className="checkout-file-chip">{paymentProof.name}</span> : null}
                      {fieldErrors.paymentProof ? <span className="field__error">{fieldErrors.paymentProof}</span> : null}
                    </label>
                  </div>
                </div>
              )}
            </Step>
          </div>
          <aside className="summary">
            <h2>Review</h2>
            {items.map((item) => (
              <div key={item.product.id} className="summary-product">
                <img src={resolveMediaUrl(item.product.image_url) || "/images/site/placeholder-product.jpg"} alt={item.product.name} />
                <p><span>{item.quantity} x {item.product.name}</span><strong>${(Number(item.product.price) * item.quantity).toFixed(2)}</strong></p>
              </div>
            ))}
            <p><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></p>
            <p><span>Delivery</span><strong>${deliveryFee.toFixed(2)}</strong></p>
            <p className="summary__total"><span>Total</span><strong>${total.toFixed(2)}</strong></p>
            <p className="muted">{paymentMethod} / {fulfilmentMethod}</p>
            {error && <div className="error-card">{error}</div>}
            {items.length ? <AppButton onClick={placeOrder} disabled={placing}>{placing ? "Placing Order..." : "Place Order"}</AppButton> : <Link className="btn btn--secondary" to="/shop">Return to Shop</Link>}
          </aside>
        </Container>
      </Section>
    </main>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="checkout-step">
      <h2><span>{number}</span>{title}</h2>
      {children}
    </section>
  );
}

function Choice({ icon, title, copy, selected, onClick }: { icon: any; title: ReactNode; copy: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? "choice-card choice-card--selected" : "choice-card"} onClick={onClick}>
      <FontAwesomeIcon icon={icon} />
      <strong>{title}</strong>
      <span>{copy}</span>
    </button>
  );
}
