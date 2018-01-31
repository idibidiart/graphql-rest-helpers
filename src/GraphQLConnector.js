import DataLoader from 'dataloader';
import rp from 'request-promise';
import defaultLogger from './defaultLogger';

/**
 * An abstract class to lay groundwork for data connectors.
 */
export default class GraphQLConnector {

  constructor() {
    if (new.target === GraphQLConnector) {
      throw new Error('Cannot construct GraphQLConnector classes directly');
    }
  }

  headers = {};

  request = rp;

  logger = defaultLogger;

  /**
   * Get configuration options for `request-promise`.
   * @param  {string} uri the URI where the request should be sent
   * @return {object}
   */
  getRequestConfig = uri => ({
    uri,
    json: true,
    resolveWithFullResponse: true,
    headers: { ...this.headers },
  });

  /**
   * Executes a request for data from a given URI
   * @param  {string}  uri  the URI to load
   * @return {Promise}      resolves with the loaded data; rejects with errors
   */
  getRequestData = uri =>
    new Promise((resolve, reject) => {
      this.logger.info(`Request made to ${uri}`);
      this.request(this.getRequestConfig(uri))
        .then(response => {
          const data = response.body;
          resolve(data)
        })
        .catch(error => {
          // resolve here and handle errors higher up so Promise.all 
          // is not cut short due to promise rejection
          // 
          // Serializing the error object is a workaround 
          // for 'request' module issue for non-HTTP network errors e.g. 
          // ECONNREFUSED, which seem to come in as Buffer objects for 
          // HTTPS socket failures causing loss of some error data
          // Could be wrong but this was needed to get 'options' and 
          // 'error' nodes 
          resolve(JSON.parse(JSON.stringify(error)))
        });
    });

  /**
   * Loads an array of URIs
   * @param  {Array}   uris an array of URIs to request data from
   * @return {Promise}      the response from all requested URIs
   */
  load = uris => Promise.all(uris.map(this.getRequestData));

  /**
   * Configures and sends a GET request to a REST API endpoint.
   * @param  {string}  endpoint the API endpoint to send the request to
   * @param  {object}  config   optional configuration for the request
   * @return {Promise}          Promise that resolves with the request result
   */
  get(endpoint) {
    this.createLoader();
    return this.loader.load(`${this.apiBaseUri}${endpoint}`);
  }

  /**
   * Helper method for sending non-cacheable requests.
   *
   * @see https://github.com/request/request-promise
   *
   * @param  {string}  endpoint  the API endpoint to hit
   * @param  {string}  method    the HTTP request method to use
   * @param  {object}  options   config options for request-promise
   * @return {Promise}           result of the request
   */
  mutation(endpoint, method, options) {
    const config = {
      // Start with our baseline configuration.
      ...this.getRequestConfig(`${this.apiBaseUri}${endpoint}`),

      // Add some PUT-specific options.
      method,

      // Allow the caller to override options.
      ...options,
    };

    return this.request(config);
  }

  /**
   * Configures and sends a POST request to a REST API endpoint.
   * @param  {string} endpoint the API endpoint to send the request to
   * @param  {object} body     optional body to be sent with the request
   * @param  {object} config   optional configuration for request-promise
   * @return {Promise}         Promise that resolves with the request result
   */
  post(endpoint, body = {}, options = {}) {
    return this.mutation(endpoint, 'POST', {
      body,
      ...options,
    });
  }

  /**
   * Configures and sends a PUT request to a REST API endpoint.
   * @param  {string} endpoint the API endpoint to send the request to
   * @param  {object} body     optional body to be sent with the request
   * @param  {object} config   optional configuration for request-promise
   * @return {Promise}         Promise that resolves with the request result
   */
  put(endpoint, body = {}, options = {}) {
    return this.mutation(endpoint, 'PUT', {
      body,
      ...options,
    });
  }

  createLoader() {
    // We can enable batched queries later on, which may be more performant.
    this.loader = new DataLoader(this.load, {
      batch: false,
    });
  }
}
