export interface Item {
    id: number;
    name: string;
    price: number;
    image: string;
    description?: string;
    isSpecial?: boolean;
}
export interface Soup {
    id: string;
    name: string;
    image: string;
    isSpicy?: boolean;
    isSpecial?: boolean;
}
export interface SpiceLevel {
    id: string;
    name: string;
    price?: number;
}
export declare enum DiningLocation {
    DineIn = "DINE_IN",
    Takeaway = "TAKEAWAY"
}
export declare enum CookingStyle {
    ReadyToEat = "READY_TO_EAT",
    SeparateSoup = "SEPARATE_SOUP",
    Uncooked = "UNCOOKED"
}
export interface Order {
    id?: number;
    order_number?: string;
    queue_number?: number;
    weight_grams: number;
    price_per_100g: number;
    base_price: number;
    addons_total?: number;
    spice_price?: number;
    subtotal: number;
    vat_rate?: number;
    vat_amount: number;
    total_price: number;
    soup_id?: string | null;
    spice_level_id?: string | null;
    dining_location: string;
    table_number?: number | null;
    cooking_style: string;
    note?: string;
    payment_method?: string;
    payment_status?: string;
    payment_reference?: string;
    order_status?: string;
    member_id?: number | null;
    created_at?: Date;
    updated_at?: Date;
}
export interface OrderAddon {
    id?: number;
    order_id: number;
    addon_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
}
export type KitchenOrderStatus = 'queued' | 'in-progress' | 'done';
//# sourceMappingURL=index.d.ts.map