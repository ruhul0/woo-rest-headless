import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WooHeadless } from '../src/client';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('WooHeadless Client', () => {
    beforeEach(() => {
        fetchMock.mockReset();
    });

    it('should initialize with config', () => {
        const client = new WooHeadless({ url: 'https://example.com' });
        expect(client.config.url).toBe('https://example.com');
    });

    it('should make a GET request', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        });

        const client = new WooHeadless({ url: 'https://example.com' });
        const res = await client.request('GET', '/test-endpoint');

        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.com/test-endpoint',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json'
                })
            })
        );
        expect(res).toEqual({ success: true });
    });

    it('should use Bearer token if set', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({})
        });

        const client = new WooHeadless({ url: 'https://example.com' });
        client.setToken('my-token');
        await client.request('GET', '/test');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-WRH-Token': 'my-token'
                })
            })
        );
    });

    it('should use Basic Auth if consumer keys provided and no token', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({})
        });

        const client = new WooHeadless({ 
            url: 'https://example.com',
            consumerKey: 'ck_123',
            consumerSecret: 'cs_123' 
        });
        await client.request('GET', '/test');

        // buffer is available in node environment (vitest runs in node by default or uses happy-dom/jsdom)
        // Check if environment supports btoa or buffer in the implementation
        // Our test environment (generic) likely has Buffer or we can rely on how we implemented it.
        // Let's just check the header presence.
        expect(fetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': expect.stringMatching(/^Basic /)
                })
            })
        );
    });

    it('should handle errors', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({ message: 'Invalid data' })
        });

        const client = new WooHeadless({ url: 'https://example.com' });
        
        await expect(client.request('GET', '/fail')).rejects.toEqual({ message: 'Invalid data' });
    });
});
