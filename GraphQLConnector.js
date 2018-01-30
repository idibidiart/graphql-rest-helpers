var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import DataLoader from 'dataloader';
import rp from 'request-promise';
import defaultLogger from './defaultLogger';

/**
 * An abstract class to lay groundwork for data connectors.
 */
export default class GraphQLConnector {

  constructor() {
    this.headers = {};
    this.request = rp;
    this.logger = defaultLogger;

    this.getRequestConfig = uri => ({
      uri,
      json: true,
      resolveWithFullResponse: true,
      headers: _extends({}, this.headers)
    });

    this.getRequestData = uri => new Promise((resolve, reject) => {
      this.logger.info(`Request made to ${uri}`);
      this.request(this.getRequestConfig(uri)).then(response => {
        const data = response.body;
        // If the data came through alright, cache it.
        if (response.statusCode === 200) {
          this.addToCache(key, data);
        }
        resolve(data);
      }).then(response => !hasCache && resolve(response)).catch(error => {
        // resolve here and handle errors higher up so Promise.all 
        // is not cut short due to promise rejection
        // 
        // Serializing and recreating the error object is a workaround 
        // for 'request' module issue for non-HTTP network errors e.g. 
        // ECONNREFUSED, which seem to come in as Buffer objects for 
        // HTTPS socket failures rather than JS objects 
        resolve(JSON.parse(JSON.stringify(error)));
      });
    });

    this.load = uris => Promise.all(uris.map(this.getRequestData));

    if (new.target === GraphQLConnector) {
      throw new Error('Cannot construct GraphQLConnector classes directly');
    }
  }

  /**
   * Get configuration options for `request-promise`.
   * @param  {string} uri the URI where the request should be sent
   * @return {object}
   */


  /**
   * Executes a request for data from a given URI
   * @param  {string}  uri  the URI to load
   * @return {Promise}      resolves with the loaded data; rejects with errors
   */


  /**
   * Loads an array of URIs
   * @param  {Array}   uris an array of URIs to request data from
   * @return {Promise}      the response from all requested URIs
   */


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
    const config = _extends({}, this.getRequestConfig(`${this.apiBaseUri}${endpoint}`), {

      // Add some PUT-specific options.
      method

    }, options);

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
    return this.mutation(endpoint, 'POST', _extends({
      body
    }, options));
  }

  /**
   * Configures and sends a PUT request to a REST API endpoint.
   * @param  {string} endpoint the API endpoint to send the request to
   * @param  {object} body     optional body to be sent with the request
   * @param  {object} config   optional configuration for request-promise
   * @return {Promise}         Promise that resolves with the request result
   */
  put(endpoint, body = {}, options = {}) {
    return this.mutation(endpoint, 'PUT', _extends({
      body
    }, options));
  }

  createLoader() {
    // We can enable batched queries later on, which may be more performant.
    this.loader = new DataLoader(this.load, {
      batch: false
    });
  }
}