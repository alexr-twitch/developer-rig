import { Product, DeserializedProduct } from '../core/models/product';
import { ExtensionManifest } from '../core/models/manifest';
import { toCamelCase } from '../util/case';
import { createConfigurationToken } from './token';

class Api {
  private isLocal: boolean;

  constructor({ isLocal }: { isLocal: boolean }) {
    this.isLocal = isLocal;
  }

  public async get<T>(path: string, headers?: HeadersInit): Promise<T> {
    return this.fetch<T>('GET', path, headers);
  }

  public async post<T = void>(path: string, body: any, headers?: HeadersInit): Promise<T> {
    return this.fetch<T>('POST', path, headers, body);
  }

  public async put<T = void>(path: string, body: any, headers?: HeadersInit): Promise<T> {
    return this.fetch<T>('PUT', path, headers, body);
  }

  public async fetch<T>(method: 'GET' | 'POST' | 'PUT', path: string, headers: HeadersInit, body?: any): Promise<T> {
    const overridableHeaders: HeadersInit = {
      Accept: 'application/vnd.twitchtv.v5+json; charset=UTF-8',
      'X-Requested-With': 'developer-rig; 0.6.0',
    };
    if (body) {
      overridableHeaders['Content-Type'] = 'application/json; charset=UTF-8';
    }
    headers = headers ? Object.assign(overridableHeaders, headers) : overridableHeaders;
    const request: RequestInit = {
      method,
      headers,
    };
    if (body) {
      request.body = JSON.stringify(body);
    }
    const url = new URL(path, `https://${this.isLocal ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv'}`);
    const response = await fetch(url.toString(), request);
    if (response.status >= 400) {
      const message = 'Cannot access Twitch API.  Try again later.';
      throw new Error(await response.json().then((json) => json.message || message).catch(() => message));
    } else if (response.status !== 204) {
      return await response.json() as T;
    }
  }
}

const localApi = new Api({ isLocal: true });
const onlineApi = new Api({ isLocal: false });

export async function createProject(projectFolderPath: string, codeGenerationOption: string, exampleIndex: number) {
  const path = '/project';
  return await localApi.post(path, { projectFolderPath, codeGenerationOption, exampleIndex });
}

export async function hostFrontend(frontendFolderPath: string, isLocal: boolean, port: number, projectFolderPath: string) {
  const path = '/frontend';
  return await localApi.post(path, { frontendFolderPath, isLocal, port, projectFolderPath });
}

export async function startFrontend(frontendFolderPath: string, frontendCommand: string, projectFolderPath: string) {
  const path = '/frontend';
  return await localApi.post(path, { frontendFolderPath, frontendCommand, projectFolderPath });
}

export async function startBackend(backendCommand: string, projectFolderPath: string) {
  const path = '/backend';
  return await localApi.post(path, { backendCommand, projectFolderPath });
}

export interface HostingStatus {
  isBackendRunning: boolean;
  isFrontendRunning: boolean;
}

export async function fetchHostingStatus(): Promise<HostingStatus> {
  const path = '/status';
  return await localApi.get<HostingStatus>(path);
}

export interface StopResult {
  backendResult: string;
  frontendResult: string;
}

export enum StopOptions {
  Backend = 1,
  Frontend = 2,
}

export async function stopHosting(stopOptions?: StopOptions): Promise<StopResult> {
  const path = '/stop';
  return await localApi.post<StopResult>(path, { stopOptions: stopOptions || (StopOptions.Backend | StopOptions.Frontend) });
}

export interface Example {
  title: string;
  description: string;
  repository: string;
  frontendFolderName: string;
  frontendCommand: string;
  backendCommand: string;
  npm: string[];
}

export async function fetchExamples(): Promise<Example[]> {
  const path = '/examples';
  return await localApi.get<Example[]>(path);
}

export async function fetchExtensionManifest(isLocal: boolean, id: string, version: string, jwt: string): Promise<ExtensionManifest> {
  const api = new Api({ isLocal });
  const response = await api.get<{ extensions: any[] }>(`/extensions/${id}/${version}`, {
    Authorization: `Bearer ${jwt}`,
    'Client-ID': id,
  });
  if (response) {
    const manifest = toCamelCase(response) as ExtensionManifest;
    return manifest;
  }
  throw new Error('Unable to retrieve extension manifest; please verify your client ID, secret, and version');
}

interface UsersResponse {
  data: {
    broadcaster_type: string;
    description: string;
    display_name: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: string;
    view_count: number;
  }[];
}

export async function fetchUser(token: string, idOrLogin?: string, isId?: boolean) {
  const path = `/helix/users${idOrLogin ? `?${isId ? 'id' : 'login'}=${idOrLogin}` : ''}`;
  const response = await onlineApi.get<UsersResponse>(path, {
    Authorization: `Bearer ${token}`,
  });
  const { data } = response;
  if (data && data.length) {
    return data[0];
  }
  if (idOrLogin) {
    // Did not find that user.
    return null;
  }
  throw new Error(`Invalid server response for access token ${token}`);
}

interface ProductsResponse {
  products: DeserializedProduct[];
}

export async function fetchProducts(clientId: string, token: string): Promise<Product[]> {
  const path = `/v5/bits/extensions/twitch.ext.${clientId}/products?includeAll=true`;
  const response = await onlineApi.get<ProductsResponse>(path, {
    Authorization: `OAuth ${token}`,
    'Client-ID': clientId,
  });
  if (response.products) {
    return response.products.map((p: DeserializedProduct) => ({
      sku: p.sku || '',
      displayName: p.displayName || '',
      amount: p.cost ? Number(p.cost.amount) : 1,
      inDevelopment: p.inDevelopment ? 'true' : 'false',
      broadcast: p.broadcast ? 'true' : 'false',
      deprecated: p.expiration ? Date.parse(p.expiration) <= Date.now() : false,
      dirty: false,
      savedInCatalog: false,
    } as Product));
  }
  throw new Error(`Invalid server response for access token ${token}`);
}

export async function saveProduct(clientId: string, token: string, product: Product) {
  const path = `/v5/bits/extensions/twitch.ext.${clientId}/products/put`;
  const deserializedProduct = {
    domain: 'twitch.ext.' + clientId,
    sku: product.sku,
    displayName: product.displayName,
    cost: {
      amount: product.amount,
      type: 'bits'
    },
    inDevelopment: product.inDevelopment === 'true',
    broadcast: product.broadcast === 'true',
    expiration: product.deprecated ? new Date(Date.now()).toISOString() : null,
  };
  return onlineApi.post(path, { product: deserializedProduct }, {
    Authorization: `OAuth ${token}`,
    'Client-ID': clientId,
  });
}

export async function fetchNewRelease() {
  const url = 'https://api.github.com/repos/twitchdev/developer-rig/releases/latest';
  const response = await onlineApi.get<any>(url, {
    Accept: 'application/vnd.github.v3+json',
  });
  const tagName = response.tag_name;
  const zipUrl = response.assets[0].browser_download_url;
  if (tagName && zipUrl) {
    return {
      tagName,
      zipUrl,
    };
  }
}

interface SegmentRecordMap {
  [key: string]: {
    record: ExtensionCoordinator.Segment;
  }
}

export async function fetchGlobalConfigurationSegment(clientId: string, userId: string, secret: string): Promise<ExtensionCoordinator.Segment> {
  const path = `/extensions/${clientId}/configurations/segments/global`;
  const headers = {
    Authorization: `Bearer ${createConfigurationToken(secret, userId)}`,
    'Client-ID': clientId,
  };
  const segmentMap = await onlineApi.get<SegmentRecordMap>(path, headers);
  const global = segmentMap['global:'];
  return global ? global.record : null;
}

export interface SegmentMap {
  broadcaster?: ExtensionCoordinator.Segment;
  developer?: ExtensionCoordinator.Segment;
}

export async function fetchChannelConfigurationSegments(clientId: string, userId: string, channelId: string, secret: string): Promise<SegmentMap> {
  const path = `/extensions/${clientId}/configurations/channels/${channelId}`;
  const headers = {
    Authorization: `Bearer ${createConfigurationToken(secret, userId)}`,
    'Client-ID': clientId,
  };
  const segmentMap = await onlineApi.get<SegmentRecordMap>(path, headers);
  const broadcaster = segmentMap[`broadcaster:${channelId}`];
  const developer = segmentMap[`developer:${channelId}`];
  const segments = {} as SegmentMap;
  if (broadcaster) {
    segments.broadcaster = broadcaster.record;
  }
  if (developer) {
    segments.developer = developer.record;
  }
  return segments;
}

export async function saveConfigurationSegment(clientId: string, userId: string, secret: string, segment: string, channelId: string, content: string, version: string) {
  const path = `/extensions/${clientId}/configurations`;
  const headers = {
    Authorization: `Bearer ${createConfigurationToken(secret, userId)}`,
    'Client-ID': clientId,
  };
  const body: { [key: string]: string } = {
    segment,
    version,
    content,
  };
  if (segment !== 'global') {
    body.channel_id = channelId;
  }
  onlineApi.put(path, body, headers);
}
