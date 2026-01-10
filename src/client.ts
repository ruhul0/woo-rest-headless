import { WooHeadlessConfig, NextFetchRequestInit } from './types';

export class WooHeadless {
  public config: WooHeadlessConfig;
  private token: string | null = null;
  
  public defaultFetchOptions: NextFetchRequestInit = {
      cache: 'no-store' 
  };

  constructor(config: WooHeadlessConfig) {
    this.config = config;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getToken() {
     return this.token;
  }

  public async request<T>(method: string, endpoint: string, data?: any, fetchOptions?: NextFetchRequestInit): Promise<T> {
    const baseUrl = this.config.url.replace(/\/$/, '');
    const path = endpoint.replace(/^\//, '');
    let url = `${baseUrl}/${path}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (this.token) {
        headers['X-WRH-Token'] = this.token;
    } else if (this.config.consumerKey && this.config.consumerSecret) {
        if (typeof btoa !== 'undefined') {
            const hash = btoa(`${this.config.consumerKey}:${this.config.consumerSecret}`);
            headers['Authorization'] = `Basic ${hash}`;
        } else {
             const hash = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
             headers['Authorization'] = `Basic ${hash}`;
        }
    }

    let body: string | undefined = undefined;

    if (method === 'GET' && data) {
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                if (typeof data[key] === 'object') {
                    params.append(key, String(data[key]));
                } else {
                    params.append(key, String(data[key]));
                }
            }
        });
        const qs = params.toString();
        if (qs) url += `?${qs}`;
    } else if (data) {
        body = JSON.stringify(data);
    }

    try {
        const res = await fetch(url, {
            method,
            headers,
            body,
            ...this.defaultFetchOptions,
            ...fetchOptions
        });

        if (!res.ok) {
            let errData: any;
            try { errData = await res.json(); } catch(e) { errData = { message: res.statusText }; }
            
            if (this.config.debug) console.error(`WRH API Error ${res.status}:`, errData);
            throw errData;
        }

        if (res.status === 204) return {} as T;

        return await res.json();
    } catch (error: any) {
        if (this.config.debug) console.error(`WRH Fetch Error [${endpoint}]:`, error);
        throw error;
    }
  }

  public auth = {
    login: (data: { username?: string; password?: string; phone?: string; otp?: string }) => 
        this.request<any>('POST', '/wp-json/wrh/v1/login', data)
        .then(res => { if(res.token) this.setToken(res.token); return res; }),

    register: (data: { phone: string; password?: string; first_name?: string; last_name?: string; otp?: string }) =>
        this.request<any>('POST', '/wp-json/wrh/v1/register', data)
        .then(res => { if(res.token) this.setToken(res.token); return res; }),

    sendOtp: (phone: string) => 
        this.request<any>('POST', '/wp-json/wrh/v1/send-otp', { phone }),

    verifyOtp: (phone: string, otp: string, action: 'login' | 'verify' = 'login') =>
        this.request<any>('POST', '/wp-json/wrh/v1/verify-otp', { phone, otp, action })
        .then(res => { if(res.token) this.setToken(res.token); return res; }),
  }

  public profile = {
    get: () => this.request<any>('GET', '/wp-json/wrh/v1/profile'),
    update: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/profile', data),
    getOrders: () => this.request<any>('GET', '/wp-json/wrh/v1/orders'),
  }

  public shipping = {
      calculate: (address: any, items: any) => this.request<any>('POST', '/wp-json/wrh/v1/shipping/calculate', { address, items }),
      zones: () => this.request<any[]>('GET', '/wp-json/wc/v3/shipping/zones'),
      getMethods: (zoneId: number) => this.request<any[]>('GET', `/wp-json/wc/v3/shipping/zones/${zoneId}/methods`),
      updateMethod: (zoneId: number, methodId: number, data: any) => this.request<any>('PUT', `/wp-json/wc/v3/shipping/zones/${zoneId}/methods/${methodId}`, data),
      deleteMethod: (zoneId: number, methodId: number) => this.request<any>('DELETE', `/wp-json/wc/v3/shipping/zones/${zoneId}/methods/${methodId}`, { force: true }),
      addMethod: (zoneId: number, data: { method_id: string }) => this.request<any>('POST', `/wp-json/wc/v3/shipping/zones/${zoneId}/methods`, data),
  }

  public checkout = {
      createOrder: (data: any) => this.request<any>('POST', '/wp-json/wc/v3/orders', data),
      updateOrder: (id: number, data: any) => this.request<any>('PUT', `/wp-json/wc/v3/orders/${id}`, data),
      getOrder: (id: number) => this.request<any>('GET', `/wp-json/wc/v3/orders/${id}`),
      abandoned: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/checkout/abandoned', data),
  }

  public content = {
      menus: (name?: string) => this.request<any>('GET', `/wp-json/wrh/v1/menus${name ? '/'+name : ''}`, undefined, { cache: 'force-cache', next: { tags: ['menus'], revalidate: 3600 } }),
      banners: (location?: string) => this.request<any>('GET', '/wp-json/wrh/v1/banners', location ? { location } : undefined, { cache: 'force-cache', next: { tags: ['banners'], revalidate: 3600 } }), 
      createBanner: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/banners', data),
      updateBanner: (id: number, data: any) => this.request<any>('POST', `/wp-json/wrh/v1/banners/${id}`, data),
      deleteBanner: (id: number) => this.request<any>('DELETE', `/wp-json/wrh/v1/banners/${id}`), 
      brands: () => this.request<any>('GET', '/wp-json/wc/store/v1/products/brands', undefined, { cache: 'force-cache', next: { tags: ['brands'], revalidate: 3600 } }),
      reviews: (productId?: number) => this.request<any>('GET', '/wp-json/wrh/v1/reviews', productId ? { product_id: productId } : undefined, { cache: 'force-cache', next: { tags: ['reviews'], revalidate: 3600 } }),
      createReview: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/reviews', data),
      deleteReview: (id: number) => this.request<any>('DELETE', `/wp-json/wrh/v1/reviews/${id}`),
  }

  public admin = {
    layout: {
        getHome: () => this.request<any>('GET', '/wp-json/wrh/v1/admin/layout/home', undefined, { cache: 'no-store' }),
        updateHome: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/admin/layout/home', data),
        getHeader: () => this.request<any>('GET', '/wp-json/wrh/v1/admin/layout/header', undefined, { cache: 'no-store' }),
        updateHeader: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/admin/layout/header', data),
        getFooter: () => this.request<any>('GET', '/wp-json/wrh/v1/admin/layout/footer', undefined, { cache: 'no-store' }),
        updateFooter: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/admin/layout/footer', data),
    },
    menus: {
        get: () => this.request<any>('GET', '/wp-json/wrh/v1/menus', undefined, { cache: 'no-store' }),
        create: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/menus', data),
        delete: (id: string) => this.request<any>('DELETE', `/wp-json/wrh/v1/menus/${id}`),
        getDetails: (id: string) => this.request<any>('GET', `/wp-json/wrh/v1/menus/${id}`, undefined, { cache: 'no-store' }),
        addItem: (data: any) => this.request<any>('POST', '/wp-json/wrh/v1/menus/items', data),
        bulkUpdateItems: (items: any[]) => this.request<any>('POST', '/wp-json/wrh/v1/menus/items/bulk', { items }),
        deleteItem: (id: number) => this.request<any>('DELETE', `/wp-json/wrh/v1/menus/items/${id}`)
    }
  }

  public universal = {
      query: (args: any) => this.request<any>('POST', '/wp-json/wrh/v1/universal/query', args),
      option: (name: string, value?: string) => value ? this.request('POST', '/wp-json/wrh/v1/universal/option', {name, value}) : this.request('GET', '/wp-json/wrh/v1/universal/option', {name}),
      meta: (data: { id: number; key: string; type?: string; value?: any }) => data.value ? this.request('POST', '/wp-json/wrh/v1/universal/meta', data) : this.request('GET', '/wp-json/wrh/v1/universal/meta', data),
      shortcode: (code: string) => this.request<any>('POST', '/wp-json/wrh/v1/universal/shortcode', { code }),
      action: (action: string, args: any) => this.request('POST', '/wp-json/wrh/v1/universal/action', { action, args }),
  }
}
