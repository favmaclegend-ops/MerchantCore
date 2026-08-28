import { createStore } from "elk-components";


export interface DiscountOrderTarget {
  /** The discount offer link that authenticates/validates the reduction. */
  discountLink: string;
  discountImage: string;
  product_id: string;
  oldPrice: string;
  newPrice: string;
  sentAt: string;
  shopId: string;
  shopName: string;
  itemName: string;
}

export const generalStore = createStore<{
    isNegotiationPanel: boolean,
    isDiscountPanel: boolean,
    discountLink: string,
    discountImage: string,
    product_id: string,
    oldPrice: string,
    newPrice: string,
    messageType: 'normal' | "discount",
    /** When set, the buyer-side discount order panel is open for this offer. */
    discountOrder: DiscountOrderTarget | null,
}>({
    isNegotiationPanel: false,
    isDiscountPanel: false,
    discountLink: "",
    discountImage: "",
    oldPrice: "",
    newPrice: "",
    messageType: 'normal',
    product_id: "",
    discountOrder: null,
})