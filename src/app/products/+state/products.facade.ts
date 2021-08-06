import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { InventoryTypeItem, Product, ProductsFilter, ProductsPager } from '../models/products.models';

@Injectable()
export class ProductsFacade {
  private filter: ProductsFilter = {};
  private pager: ProductsPager = { offset: 0, count: 10 };

  private readonly _products$ = new BehaviorSubject<Product[]>([]);
  readonly products$ = this._products$.asObservable();

  private readonly _productsLoaded$ = new BehaviorSubject(false);
  readonly productsLoaded$ = this._productsLoaded$.asObservable();

  private readonly _productsInitiallyLoaded$ = new BehaviorSubject(false);
  readonly productsInitiallyLoaded$ = this._productsInitiallyLoaded$.pipe(distinctUntilChanged());

  private readonly _totalCount$ = new BehaviorSubject(0);
  readonly totalCount$ = this._totalCount$.asObservable();

  private readonly _inventoryTypes$ = new BehaviorSubject<InventoryTypeItem[]>([]);
  readonly inventoryTypes$ = this._inventoryTypes$.asObservable();

  private readonly _inventoryTypesLoaded$ = new BehaviorSubject(false);
  readonly inventoryTypesLoaded$ = this._inventoryTypesLoaded$.asObservable();

  getProducts(): void {
    if (this.pager.offset !== 0) {
      this._productsInitiallyLoaded$.next(false);
    }
    this._productsLoaded$.next(false);
    setTimeout(() => {
      let result = PRODUCTS_DATA.filter(
        (p) => {
          const matchedByName = !this.filter.searchText || p.name.toLowerCase().includes(this.filter.searchText.toLowerCase());
          if (!matchedByName) return false;
          const matchedByInventory = !this.filter.inventory_type || p.inventory_type === this.filter.inventory_type;
          if (!matchedByInventory) return false;
          return true;
        }
      );
      this._products$.next(result.slice(this.pager.offset, this.pager.offset + this.pager.count));
      this._totalCount$.next(result.length);
      this._productsLoaded$.next(true);
      this._productsInitiallyLoaded$.next(true);
    }, 300);
  }

  loadInventoryTypes() {
    this._inventoryTypesLoaded$.next(false);
    setTimeout(() => {
      this._inventoryTypes$.next(INVENTORY_TYPES);
      this._inventoryTypesLoaded$.next(true);
    }, 300);
  }

  setFilters(filters: ProductsFilter) {
    this.filter = filters;
    this.getProducts();
  }

  setPager(pager: ProductsPager) {
    this.pager = pager;
    this.getProducts();
  }
}

const INVENTORY_TYPES: InventoryTypeItem[] = [
  {
    displayed_name: 'Электрическая',
    type: 'Electrical',
  },
  {
    displayed_name: 'Механическая',
    type: 'Mechanical',
  },
  {
    displayed_name: 'Химическая',
    type: 'Chemical',
  },
  {
    displayed_name: 'Пневматическая',
    type: 'Pneumo',
  },
  {
    displayed_name: 'Гидравлическая',
    type: 'Hydro',
  },
  {
    displayed_name: 'Газ',
    type: 'Gas',
  },
  {
    displayed_name: 'Перегретый пар',
    type: 'Steam',
  },
];

const PRODUCTS_DATA: Product[] = new Array(50).fill(null).map((e, index) => {
  return {
    name: 'Product ' + index + 1,
    inventory_id: Math.floor(Math.random() * 16777215).toString(16).toUpperCase(),
    inventory_type: INVENTORY_TYPES[Math.floor(Math.random() * INVENTORY_TYPES.length)].type,
  };
});
