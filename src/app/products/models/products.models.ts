export interface ProductsPager {
    offset: number;
    count: number;
}

export interface ProductsFilter {
    searchText?: string;
    inventory_type?: string;
}

export interface Product {
    name: string;
    inventory_id: string;
    inventory_type: string;
}

export interface InventoryTypeItem {
    type: string;
    displayed_name: string;
}
