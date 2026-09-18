import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useRef, useState, type CSSProperties } from "react";
import { createOrgService } from "./service_demo";


interface OrgServiceFormProp {
  onClose: () => void;
}

export default function OrgServiceForm({ onClose }: OrgServiceFormProp) {
  const bp = useBreakpoint();
  const serviceName = useRef<HTMLInputElement>(null);
  const servicePricingType = useRef<HTMLSelectElement>(null);
  const servicePrice = useRef<HTMLInputElement>(null);
  const serviceCategory = useRef<HTMLInputElement>(null);
  const description = useRef<HTMLTextAreaElement>(null);
  const serviceImageUrl = useRef<HTMLInputElement>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    createOrgService({
        name: serviceName?.current?.value ?? "",
        pricing_type: (servicePricingType?.current?.value as "flat" | "hourly" | "variable") ?? "flat",
        price: parseFloat(servicePrice?.current?.value ?? "0"),
        category: serviceCategory?.current?.value ?? "",
        description: description?.current?.value ?? "",
        service_img: serviceImageUrl?.current?.value ?? "",
        status: "Inactive",
      })
      .then((res) => {
        setSubmitting(false);
        console.log(res);
        onClose();
      })
      .catch((e) => {
        setSubmitting(false);
        console.log("Error occur while adding the new service:", e);
      });
  };
  return (
    <>
      <div
        onClick={(e) => e.currentTarget === e.target && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 111,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(12px)",
          padding: "1rem",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        <form
          onSubmit={(e) => handleSubmit(e as unknown as SubmitEvent)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            background: "var(--bg-surface)",
            borderRadius: "1rem",
            position: "absolute",
            padding: "1rem",
            paddingBottom: "calc(1rem + var(--safe-bottom))",
            width: bp.sm ? "100%" : "90%",
            maxWidth: "400px",
            bottom: bp.sm ? 0 : undefined,
            height: bp.sm ? "35rem" : undefined,
          }}
        >
          <h1 style={{ fontWeight: "bolder" }}>New Service</h1>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              placeholder="Service name..."
              style={orgServiceFormInputStyle}
              required
            ref={serviceName}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              width: "100%",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".4rem",
                width: "100%",
                color: "var(--text-primary)",
              }}
            >
              <label htmlFor="pricing-type">Pricing Type</label>
              <select ref={servicePricingType} id="pricing-type" style={orgServiceFormInputStyle}>
                <option value="flat">Flat</option>
                <option value="hourly">Hourly</option>
                <option value="variable">Variable</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".4rem",
                width: "100%",
                color: "var(--text-primary)",
              }}
            >
              <label htmlFor="price">Price</label>
              <input
              ref={servicePrice}
                id="price"
                style={orgServiceFormInputStyle}
                placeholder="Price: 0.00"
                type="number"
                required
              />
            </div>
          </div>
          <textarea
          ref={description}
            maxLength={100}
            style={{
              width: "100%",
              height: "5rem",
              resize: "none",
              border: "1px solid var(--border-input)",
              padding: ".5rem",
              borderRadius: ".5rem",
              outline: "none",
              color: "var(--text-primary)",
            }}
            placeholder="Description of the service.."
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: ".4rem",
              width: "100%",
              color: "var(--text-primary)",
            }}
          >
            <label htmlFor="s-cat">Category</label>
            <input
              id="s-cat"
              style={orgServiceFormInputStyle}
              placeholder="Category"
              type="text"
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: ".4rem",
              width: "100%",
              color: "var(--text-primary)",
            }}
          >
            <label htmlFor="pricing-type">Image Url</label>
            <input
              style={orgServiceFormInputStyle}
              placeholder="https://example.com..."
              required
            />
          </div>

          <button
            className="click"
            style={{
              display: "flex",
              padding: ".8rem",
              cursor: "pointer",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: ".5rem",
              width: "100%",
              background: isSubmitting ? "grey" : "var(--bg-nav-active)",
            }}
            type="submit"
          >
            <span style={{ color: "var(--bg-surface)" }}>
              {isSubmitting ? "Adding..." : "Add"}
            </span>
          </button>
        </form>
      </div>
    </>
  );
}

const orgServiceFormInputStyle: CSSProperties = {
  fontSize: "16px",
  border: "1px solid var(--border-input)",
  padding: ".4rem",
  width: "100%",
  borderRadius: ".5rem",
  color: "var(--text-primary)",
};
