/**
 * Data Source Service
 * Handles all data source API calls
 */

import api from './api';

class DataSourceService {
  /**
   * Get all data sources
   */
  async getDataSources() {
    try {
      const response = await api.get('/data-sources');
      return response.dataSources;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single data source by ID
   */
  async getDataSource(id) {
    try {
      const response = await api.get(`/data-sources/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new data source
   */
  async createDataSource(data) {
    try {
      const response = await api.post('/data-sources', data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update data source
   */
  async updateDataSource(id, data) {
    try {
      const response = await api.put(`/data-sources/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete data source
   */
  async deleteDataSource(id) {
    try {
      const response = await api.delete(`/data-sources/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Preview data from source
   */
  async previewData(id, options = {}) {
    try {
      const response = await api.post(`/data-sources/${id}/preview`, options);
      return response;
    } catch (error) {
      throw error;
    }
  }  


  /**
   * Test data source connection
   */
  async testConnection(id) {
    try {
      const response = await api.post(`/data-sources/${id}/test`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new DataSourceService();