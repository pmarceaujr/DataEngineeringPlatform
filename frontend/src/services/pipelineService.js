import api from './api';

class PipelineService {
  /**
   * Get all pipelines
   */
  async getPipelines() {
    try {
      const response = await api.get('/pipelines');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single pipeline
   */
  async getPipeline(id) {
    try {
      const response = await api.get(`/pipelines/${id}`);
      console.log('Service: getPipeline response:', response);
      return response.pipeline || response;
    } catch (error) {
      console.error('Service: getPipeline error:', error);
      throw error;
    }
  }

  /**
   * Create pipeline
   */
  async createPipeline(data) {
    try {
      const response = await api.post('/pipelines', data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update pipeline
   */
  async updatePipeline(id, data) {
    try {
      const response = await api.put(`/pipelines/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete pipeline
   */
  async deletePipeline(id) {
    try {
      const response = await api.delete(`/pipelines/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute pipeline
   */
  async executePipeline(id) {
    try {
      const response = await api.post(`/pipelines/${id}/execute`);
      console.log('Execute pipeline API response:', response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pipeline executions
   */
  async getExecutions(id, limit, offset) {
    try {
      const response = await api.get(`/pipelines/${id}/executions`, {
        params: { limit, offset }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download data as file - THIS IS CRITICAL
   */
  downloadAsFile(data, fileName, format = 'csv', config = {}) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║ DOWNLOAD AS FILE CALLED                                    ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('Data:', data);
    console.log('Data type:', typeof data);
    console.log('Is array?', Array.isArray(data));
    console.log('Data length:', data?.length);
    console.log('File name:', fileName);
    console.log('Format:', format);
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Invalid data for download');
      alert('Error: No data to download');
      return;
    }
    
    let content, mimeType, extension;
    
    try {
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // CSV (default)
        content = this.convertToCSV(data, config);
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
      }
      
      console.log('Content length:', content.length, 'bytes');
      console.log('First 200 chars:', content.substring(0, 200));
      
      // Create blob
      const blob = new Blob([content], { type: mimeType });
      console.log('Blob size:', blob.size, 'bytes');
      
      // Create URL
      const url = window.URL.createObjectURL(blob);
      console.log('Created URL:', url);
      
      // Create link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${extension}`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      console.log('Clicking download link...');
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('✓ Download triggered successfully');
      }, 100);
      
      // Alert user
      alert(`File download started: ${fileName}.${extension}`);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed: ' + error.message);
    }
  }

  /**
   * Convert to CSV
   */
  convertToCSV(data, config = {}) {
    if (!data || data.length === 0) return '';
    
    const delimiter = config.delimiter || ',';
    const includeHeaders = config.includeHeaders !== false;
    
    // Get all keys
    const allKeys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const rows = [];
    
    if (includeHeaders) {
      rows.push(headers.map(escapeCSV).join(delimiter));
    }
    
    data.forEach(row => {
      const values = headers.map(header => escapeCSV(row[header]));
      rows.push(values.join(delimiter));
    });
    
    return rows.join('\n');
  }
}

const pipelineServiceInstance = new PipelineService();
export default pipelineServiceInstance;