import { Product } from '../core/models/product';
import {
  createProject,
  fetchChannelConfigurationSegments,
  fetchExamples,
  fetchExtensionManifest,
  fetchGlobalConfigurationSegment,
  fetchHostingStatus,
  fetchNewRelease,
  fetchProducts,
  fetchUser,
  hostFrontend,
  saveConfigurationSegment,
  saveProduct,
  startBackend,
  startFrontend,
  stopHosting,
} from './api';
import {
  mockFetchError,
  mockFetchForExtensionManifest,
  mockFetchForUserInfo,
  mockFetchProducts,
  mockSaveProduct,
  mockFetchNewRelease,
  mockEmptyResponse,
  mockFetch400,
  mockFetch500,
} from '../tests/mocks';

let globalAny = global as any;
const token = 'token';

describe('api', () => {
  describe('API.fetch', () => {
    it('throws on 400', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetch400);
      expect.assertions(1);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex.message).toEqual('400 error');
      }
    });

    it('throws on 500', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetch500);
      expect.assertions(1);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex.message).toEqual('500 error');
      }
    });

    it('throws an exception on failed fetch', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchError);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex).toEqual('Fake error');
      }
    });
  });

  describe('createProject', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await createProject('projectFolderPath', 'codeGenerationOption', 0);
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchChannelConfigurationSegments', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await fetchChannelConfigurationSegments('clientId', 'userId', 'channelId', 'secret');
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns broadcaster and developer', async function() {
      globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({
        json: () => ({
          'broadcaster:channelId': {},
          'developer:channelId': {},
        })
      }));
      await fetchChannelConfigurationSegments('clientId', 'userId', 'channelId', 'secret');
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchExamples', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await fetchExamples();
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchExtensionManifest', () => {
    it('should return data', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForExtensionManifest);
      const data = await fetchExtensionManifest('clientId', 'version', 'jwt');
      expect(data).toBeDefined();
    });

    it('throws an exception on invalid response', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      expect.assertions(1);
      try {
        await fetchExtensionManifest('clientId', 'version', 'jwt');
      } catch (ex) {
        expect(ex.message).toEqual('Unable to retrieve extension manifest; please verify your client ID, secret, and version');
      }
    });
  });

  describe('fetchGlobalConfigurationSegment', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await fetchGlobalConfigurationSegment('clientId', 'userId', 'secret');
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchHostingStatus', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await fetchHostingStatus();
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchUser', () => {
    beforeEach(() => {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForUserInfo);
    });

    it('should return data', async function() {
      const data = await fetchUser(token);
      expect(data).toBeDefined();
    });

    it('throws an exception on invalid response', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      expect.assertions(1);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex.message).toEqual(`Invalid server response for access token ${token}`);
      }
    });

    it('returns null if user id not found', async function() {
      globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({ json: () => [] }));
      const data = await fetchUser(token, '1');
      expect(data).toBe(null);
    });

    it('returns null if user name not found', async function() {
      globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({ json: () => [] }));
      const data = await fetchUser(token, '-');
      expect(data).toBe(null);
    });
  });

  describe('fetchProducts', () => {
    it('should serialize products correctly', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchProducts);
      const products = await fetchProducts('clientId', '');
      expect(products).toHaveLength(2);
      products.forEach((product: Product) => {
        expect(product).toMatchObject({
          sku: expect.any(String),
          displayName: expect.any(String),
          amount: expect.stringMatching(/[1-9]\d*/),
          inDevelopment: expect.stringMatching(/true|false/),
          broadcast: expect.stringMatching(/true|false/)
        });
      });
    });

    it('throws an exception on invalid response', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      expect.assertions(1);
      try {
        await fetchProducts('clientId', token);
      } catch (ex) {
        expect(ex.message).toEqual(`Invalid server response for access token ${token}`);
      }
    });
  });

  describe('saveConfigurationSegment', () => {
    beforeEach(function() {
      globalAny.fetch = jest.fn().mockImplementation(mockSaveProduct);
    });

    it('succeeds with channel', async function() {
      await saveConfigurationSegment('clientId', 'userId', 'secret', 'segment', 'channelId', 'content', 'version');
    });

    it('succeeds with global', async function() {
      await saveConfigurationSegment('clientId', 'userId', 'secret', 'global', '', 'content', 'version');
    });
  });

  describe('saveProduct', () => {
    beforeEach(function() {
      globalAny.fetch = jest.fn().mockImplementation(mockSaveProduct);
    });

    it('succeeds', async function() {
      await saveProduct('clientId', token, {} as Product);
    });

    it('calls the API with the correct parameters', async function() {
      const product = {
        sku: 'sku',
        displayName: 'name',
        amount: 100,
        inDevelopment: 'true',
        broadcast: 'false',
        deprecated: false,
        dirty: true,
        savedInCatalog: false
      };

      await saveProduct('clientId', token, product as Product);
      expect(globalAny.fetch).toHaveBeenCalledWith('https://api.twitch.tv/v5/bits/extensions/twitch.ext.clientId/products/put', {
        method: 'POST',
        body: JSON.stringify({
          product: {
            domain: 'twitch.ext.clientId',
            sku: 'sku',
            displayName: 'name',
            cost: {
              amount: 100,
              type: 'bits',
            },
            inDevelopment: true,
            broadcast: false,
            expiration: null
          }
        }),
        headers: {
          Accept: 'application/vnd.twitchtv.v5+json; charset=UTF-8',
          Authorization: `OAuth ${token}`,
          'Client-ID': 'clientId',
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Requested-With': 'developer-rig; 0.6.0',
        },
      });
    })
  });

  describe('fetchNewRelease', () => {
    let includeTagName: boolean;

    beforeEach(function() {
      globalAny.fetch = jest.fn().mockImplementation(() => mockFetchNewRelease(includeTagName));
    });

    it('should return data', async function() {
      includeTagName = true;
      const data = await fetchNewRelease();
      expect(data).toBeDefined();
    });

    it('fails without tag name', async function() {
      includeTagName = false;
      fetchNewRelease().catch((error) => {
        expect(error.message).toEqual('Cannot get GitHub developer rig latest release');
      })
    });
  });

  describe('hostFrontend', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await hostFrontend('frontendFolderPath', 8080, 'projectFolderPath');
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('starts back end', async () => {
    globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({ status: 200, json: () => Promise.resolve({}) }));
    await startBackend('backendCommand', 'projectFolderPath');
    expect(globalAny.fetch).toHaveBeenCalledWith('https://localhost.rig.twitch.tv:3000/backend', {
      body: JSON.stringify({ backendCommand: 'backendCommand', projectFolderPath: 'projectFolderPath' }),
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json; charset=UTF-8',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'developer-rig; 0.6.0',
      },
      method: 'POST',
    });
  });

  it('starts front end', async () => {
    globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({ status: 200, json: () => Promise.resolve({}) }));
    await startFrontend('frontendFolderPath', 'frontendCommand', 'projectFolderPath');
    expect(globalAny.fetch).toHaveBeenCalledWith('https://localhost.rig.twitch.tv:3000/frontend', {
      body: JSON.stringify({
        frontendFolderPath: 'frontendFolderPath',
        frontendCommand: 'frontendCommand',
        projectFolderPath: 'projectFolderPath',
      }),
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json; charset=UTF-8',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'developer-rig; 0.6.0',
      },
      method: 'POST',
    });
  });

  describe('stopHosting', () => {
    it('succeeds', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      await stopHosting();
      expect(globalAny.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
