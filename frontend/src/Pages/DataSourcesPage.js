import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { FaCheck, FaDatabase, FaEdit, FaEye, FaPlus, FaTimes, FaTrash, FaVial } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dataSourceService from '../services/dataSourceService';

function DataSourcesPage() {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [testing, setTesting] = useState(false);
  
  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSource, setPreviewSource] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewQuery, setPreviewQuery] = useState('');
  const [previewLimit, setPreviewLimit] = useState(10);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgresql',
    connectionConfig: {
      host: '',
      port: '',
      database: '',
      username: '',
      password: ''
    }
  });

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const sources = await dataSourceService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      toast.error('Failed to load data sources');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEditingSource(null);
    setFormData({
      name: '',
      type: 'postgresql',
      connectionConfig: {
        host: 'localhost',
        port: '5432',
        database: '',
        username: 'postgres',
        password: ''
      }
    });
    setShowModal(true);
  };

  const handleEditSource = async (source) => {
    try {
      const fullSource = await dataSourceService.getDataSource(source.id);
      setEditingSource(source);
      setFormData({
        name: fullSource.name,
        type: fullSource.type,
        connectionConfig: fullSource.connectionConfig
      });
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load data source details');
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSource(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name' || name === 'type') {
      setFormData({
        ...formData,
        [name]: value
      });
    } else {
      setFormData({
        ...formData,
        connectionConfig: {
          ...formData.connectionConfig,
          [name]: value
        }
      });
    }
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    
    let defaultConfig = {};
    
    switch(type) {
      case 'postgresql':
      case 'mysql':
        defaultConfig = {
          host: 'localhost',
          port: type === 'postgresql' ? '5432' : '3306',
          database: '',
          username: '',
          password: ''
        };
        break;
      case 'rest_api':
        defaultConfig = {
          baseUrl: '',
          apiKey: '',
          headers: {}
        };
        break;
      case 'local_file':
        defaultConfig = {
          format: 'csv',
          delimiter: ',',
          includeHeaders: true,
          fileNamePattern: 'export_{timestamp}'
        };        
      default:
        defaultConfig = {};
    }
    
    setFormData({
      ...formData,
      type: type,
      connectionConfig: defaultConfig
    });
  };

  const handleTestConnection = async (sourceId) => {
    try {
      setTesting(true);
      const result = await dataSourceService.testConnection(sourceId);
      if (result.success) {
        toast.success('Connection successful!');
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Connection test failed');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return;
      }

      if (editingSource) {
        await dataSourceService.updateDataSource(editingSource.id, formData);
        toast.success('Data source updated successfully');
      } else {
        await dataSourceService.createDataSource(formData);
        toast.success('Data source created successfully');
      }
      
      handleCloseModal();
      loadDataSources();
    } catch (error) {
      toast.error(error || 'Failed to save data source');
      console.error(error);
    }
  };

  const handleDelete = async (source) => {
    if (!window.confirm(`Are you sure you want to delete "${source.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataSourceService.deleteDataSource(source.id);
      toast.success('Data source deleted successfully');
      loadDataSources();
    } catch (error) {
      toast.error('Failed to delete data source');
      console.error(error);
    }
  };

  // PREVIEW FUNCTIONS
  const handleOpenPreview = (source) => {
    setPreviewSource(source);
    setPreviewData([]);
    setPreviewColumns([]);
    setPreviewQuery('');
    setPreviewLimit(10);
    setShowPreviewModal(true);
    
    // Auto-load preview on open
    loadPreview(source.id, '', 10);
  };

  const loadPreview = async (sourceId, query = '', limit = 10) => {
    setPreviewLoading(true);
    
    try {
      const result = await dataSourceService.previewData(sourceId, {
        query: query || undefined,
        limit: limit
      });
      
      setPreviewData(result.data);
      setPreviewColumns(result.columns);
      
      if (result.data.length === 0) {
        toast.info('No data found');
      } else {
        toast.success(`Loaded ${result.data.length} rows`);
      }
    } catch (error) {
      toast.error(error || 'Failed to preview data');
      console.error(error);
      setPreviewData([]);
      setPreviewColumns([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewRefresh = () => {
    if (previewSource) {
      loadPreview(previewSource.id, previewQuery, previewLimit);
    }
  };

  const renderConfigFields = () => {
    switch(formData.type) {
      case 'postgresql':
      case 'mysql':
        return (
          <>

            <Alert variant="info" className="mb-3">
              <small>
                <strong>Database Source:</strong> Specify connection details and optionally a default table.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Host *</Form.Label>
              <Form.Control
                type="text"
                name="host"
                value={formData.connectionConfig.host || ''}
                onChange={handleChange}
                placeholder="localhost"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Port *</Form.Label>
              <Form.Control
                type="text"
                name="port"
                value={formData.connectionConfig.port || ''}
                onChange={handleChange}
                placeholder={formData.type === 'postgresql' ? '5432' : '3306'}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Database *</Form.Label>
              <Form.Control
                type="text"
                name="database"
                value={formData.connectionConfig.database || ''}
                onChange={handleChange}
                placeholder="my_database"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.connectionConfig.username || ''}
                onChange={handleChange}
                placeholder="postgres"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.connectionConfig.password || ''}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <Form.Text className="text-muted">
                Password is encrypted before storage
              </Form.Text>
            </Form.Group>

            {/* NEW: Default Table Field */}
            <Form.Group className="mb-3">
              <Form.Label>Default Table (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="table"
                value={formData.connectionConfig.table || ''}
                onChange={handleChange}
                placeholder="customers"
              />
              <Form.Text className="text-muted">
                Default table to query. Use exact case (e.g., "MyTable" not "mytable"). 
                Can be overridden in pipelines.
              </Form.Text>
            </Form.Group>
          </>
        );

      case 'rest_api':
        return (
          <>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>REST API Source:</strong> Specify the base URL and authentication.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Base URL *</Form.Label>
              <Form.Control
                type="text"
                name="baseUrl"
                value={formData.connectionConfig.baseUrl || ''}
                onChange={handleChange}
                placeholder="https://api.example.com"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control
                type="password"
                name="apiKey"
                value={formData.connectionConfig.apiKey || ''}
                onChange={handleChange}
                placeholder="your-api-key"
              />
            </Form.Group>
            {/* NEW: Default Endpoint Field */}
            <Form.Group className="mb-3">
              <Form.Label>Default Endpoint (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="endpoint"
                value={formData.connectionConfig.endpoint || ''}
                onChange={handleChange}
                placeholder="/products"
              />
              <Form.Text className="text-muted">
                Default API endpoint path. Can be overridden in pipelines.
              </Form.Text>
            </Form.Group>            
          </>
        );

      case 'local_file':
        return (
          <>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>Local File System:</strong> Files will be downloaded to the user's browser. 
                This destination can only be used in pipelines (not as a source).
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>File Format</Form.Label>
              <Form.Select
                name="format"
                value={formData.connectionConfig.format || 'csv'}
                onChange={handleChange}
              >
                <option value="csv">CSV (Comma-Separated Values)</option>
                <option value="json">JSON (JavaScript Object Notation)</option>
                <option value="excel">Excel (.xlsx)</option>
              </Form.Select>
            </Form.Group>

            {formData.connectionConfig.format === 'csv' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Delimiter</Form.Label>
                  <Form.Select
                    name="delimiter"
                    value={formData.connectionConfig.delimiter || ','}
                    onChange={handleChange}
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                    <option value="|">Pipe (|)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="Include header row"
                    name="includeHeaders"
                    checked={formData.connectionConfig.includeHeaders !== false}
                    onChange={(e) => handleChange({
                      target: { name: 'includeHeaders', value: e.target.checked }
                    })}
                  />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>File Name Pattern</Form.Label>
              <Form.Control
                type="text"
                name="fileNamePattern"
                value={formData.connectionConfig.fileNamePattern || ''}
                onChange={handleChange}
                placeholder="export_{timestamp}"
              />
              <Form.Text className="text-muted">
                Use <code>{'{'}timestamp{'}'}</code> for current date/time, 
                <code>{'{'}pipeline{'}'}</code> for pipeline name.
                <br />Example: <code>sales_data_{'{'}timestamp{'}'}</code> → 
                <code>sales_data_20240129_143022.csv</code>
              </Form.Text>
            </Form.Group>
          </>
        );        

      default:
        return (
          <Alert variant="info">
            Select a data source type to configure connection details
          </Alert>
        );
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Data Sources</h2>
        <Button variant="primary" onClick={handleOpenModal}>
          <FaPlus className="me-2" />
          Add Data Source
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Row>
          <Col>
            <Card>
              <Card.Body>
                {dataSources.length === 0 ? (
                  <div className="text-center py-5">
                    <FaDatabase size={50} className="text-muted mb-3" />
                    <h5>No Data Sources Yet</h5>
                    <p className="text-muted">
                      Click "Add Data Source" to connect your first database or API
                    </p>
                  </div>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Last Tested</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataSources.map((source) => (
                        <tr key={source.id}>
                          <td>
                            <FaDatabase className="me-2" />
                            {source.name}
                          </td>
                          <td>
                            <Badge bg="info">{source.type}</Badge>
                          </td>
                          <td>
                            {source.status === 'active' ? (
                              <Badge bg="success">
                                <FaCheck className="me-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge bg="secondary">
                                <FaTimes className="me-1" />
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td>
                            {source.lastTestedAt 
                              ? new Date(source.lastTestedAt).toLocaleString()
                              : 'Never'}
                          </td>
                          <td>
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleOpenPreview(source)}
                              title="Preview data"
                            >
                              <FaEye className="me-1" />
                              Preview
                            </Button>
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleTestConnection(source.id)}
                              disabled={testing}
                              title="Test connection"
                            >
                              <FaVial className="me-1" />
                              Test
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleEditSource(source)}
                              title="Edit"
                            >
                              <FaEdit className="me-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(source)}
                              title="Delete"
                            >
                              <FaTrash className="me-1" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSource ? 'Edit Data Source' : 'Add Data Source'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Database"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type *</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                required
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="rest_api">REST API</option>
                <option value="aws_s3">AWS S3</option>
                <option value="azure_blob">Azure Blob Storage</option>
                <option value="gcp_storage">GCP Storage</option>
                <option value="local_file">Local File System (Download)</option>
              </Form.Select>
            </Form.Group>

            <hr />
            <h6 className="mb-3">Connection Details</h6>

            {renderConfigFields()}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {editingSource && (
            <Button 
              variant="outline-info" 
              onClick={() => handleTestConnection(editingSource.id)}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Testing...
                </>
              ) : (
                <>
                  <FaVial className="me-2" />
                  Test Connection
                </>
              )}
            </Button>
          )}
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingSource ? 'Update' : 'Create'} Data Source
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="xl"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2" />
            Data Preview: {previewSource?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="data" className="mb-3">
            <Tab eventKey="data" title="Data Preview">
              {/* Query Controls */}
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      {previewSource?.type === 'postgresql' || previewSource?.type === 'mysql' ? (
                        <Form.Group>
                          <Form.Label>Custom Query (Optional)</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={previewQuery}
                              onChange={(e) => setPreviewQuery(e.target.value)}
                              placeholder='SELECT * FROM "MyTable" WHERE "MyColumn" = value'
                              style={{ fontFamily: 'monospace' }} // Use monospace for SQL
                            />
                            <Form.Text className="text-muted">
                              <strong>Tip:</strong> Use double quotes for case-sensitive names: 
                              <code>SELECT "UserId", "FirstName" FROM "Users"</code>
                            </Form.Text>
                          </Form.Group>
                      ) : (
                        <Form.Group>
                          <Form.Label>API Endpoint (Optional)</Form.Label>
                          <Form.Control
                            type="text"
                            value={previewQuery}
                            onChange={(e) => setPreviewQuery(e.target.value)}
                            placeholder="/products or /users"
                          />
                          <Form.Text className="text-muted">
                            Leave empty to use base URL
                          </Form.Text>
                        </Form.Group>
                      )}
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Limit</Form.Label>
                        <Form.Control
                          type="number"
                          value={previewLimit}
                          onChange={(e) => setPreviewLimit(parseInt(e.target.value) || 10)}
                          min="1"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <Button 
                        variant="primary" 
                        onClick={handlePreviewRefresh}
                        disabled={previewLoading}
                        className="w-100"
                      >
                        {previewLoading ? (
                          <>
                            <Spinner 
                              as="span" 
                              animation="border" 
                              size="sm" 
                              className="me-2" 
                            />
                            Loading...
                          </>
                        ) : (
                          'Refresh'
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Data Table */}
              {previewLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-3 text-muted">Loading preview data...</p>
                </div>
              ) : previewData.length === 0 ? (
                <Alert variant="info">
                  No data to preview. Check your connection or query.
                </Alert>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        {previewColumns.map((col, idx) => (
                          <th key={idx}>
                            {col.name}
                            <div>
                              <small className="text-muted">{col.type}</small>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="text-muted">{rowIdx + 1}</td>
                          {previewColumns.map((col, colIdx) => (
                            <td key={colIdx}>
                              {typeof row[col.name] === 'object' 
                                ? JSON.stringify(row[col.name])
                                : String(row[col.name] ?? 'null')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-muted">
                    <small>
                      Showing {previewData.length} row(s) × {previewColumns.length} column(s)
                    </small>
                  </div>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="info" title="Info">
              <Card>
                <Card.Body>
                  <h6>Data Source Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Name:</strong></td>
                        <td>{previewSource?.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Type:</strong></td>
                        <td><Badge bg="info">{previewSource?.type}</Badge></td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          <Badge bg={previewSource?.status === 'active' ? 'success' : 'secondary'}>
                            {previewSource?.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Columns:</strong></td>
                        <td>{previewColumns.length}</td>
                      </tr>
                      <tr>
                        <td><strong>Sample Rows:</strong></td>
                        <td>{previewData.length}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default DataSourcesPage;


// import React, { useEffect, useState } from 'react';
// import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
// import { FaCheck, FaDatabase, FaEdit, FaPlus, FaTimes, FaTrash, FaVial } from 'react-icons/fa';
// import { toast } from 'react-toastify';
// import dataSourceService from '../services/dataSourceService';

// function DataSourcesPage() {
//   const [dataSources, setDataSources] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [editingSource, setEditingSource] = useState(null);
//   const [testing, setTesting] = useState(false);
  
//   const [formData, setFormData] = useState({
//     name: '',
//     type: 'postgresql',
//     connectionConfig: {
//       host: '',
//       port: '',
//       database: '',
//       username: '',
//       password: ''
//     }
//   });

//   // Load data sources on component mount
//   useEffect(() => {
//     loadDataSources();
//   }, []);

//   // Fetch all data sources from API
//   const loadDataSources = async () => {
//     try {
//       setLoading(true);
//       const sources = await dataSourceService.getDataSources();
//       setDataSources(sources);
//     } catch (error) {
//       toast.error('Failed to load data sources');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Open modal for creating new data source
//   const handleOpenModal = () => {
//     setEditingSource(null);
//     setFormData({
//       name: '',
//       type: 'postgresql',
//       connectionConfig: {
//         host: 'localhost',
//         port: '5432',
//         database: '',
//         username: 'postgres',
//         password: ''
//       }
//     });
//     setShowModal(true);
//   };

//   // Open modal for editing existing data source
//   const handleEditSource = async (source) => {
//     try {
//       // Fetch full details including decrypted config
//       const fullSource = await dataSourceService.getDataSource(source.id);
//       setEditingSource(source);
//       setFormData({
//         name: fullSource.name,
//         type: fullSource.type,
//         connectionConfig: fullSource.connectionConfig
//       });
//       setShowModal(true);
//     } catch (error) {
//       toast.error('Failed to load data source details');
//       console.error(error);
//     }
//   };

//   // Close modal
//   const handleCloseModal = () => {
//     setShowModal(false);
//     setEditingSource(null);
//   };

//   // Handle form input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
    
//     if (name === 'name' || name === 'type') {
//       setFormData({
//         ...formData,
//         [name]: value
//       });
//     } else {
//       // Handle nested connectionConfig fields
//       setFormData({
//         ...formData,
//         connectionConfig: {
//           ...formData.connectionConfig,
//           [name]: value
//         }
//       });
//     }
//   };

//   // Handle data source type change
//   const handleTypeChange = (e) => {
//     const type = e.target.value;
    
//     // Set default config based on type
//     let defaultConfig = {};
    
//     switch(type) {
//       case 'postgresql':
//       case 'mysql':
//         defaultConfig = {
//           host: 'localhost',
//           port: type === 'postgresql' ? '5432' : '3306',
//           database: '',
//           username: '',
//           password: ''
//         };
//         break;
//       case 'rest_api':
//         defaultConfig = {
//           baseUrl: '',
//           apiKey: '',
//           headers: {}
//         };
//         break;
//       case 'aws_s3':
//         defaultConfig = {
//           bucketName: '',
//           region: 'us-east-1',
//           accessKey: '',
//           secretKey: ''
//         };
//         break;
//       case 'azure_blob':
//         defaultConfig = {
//           accountName: '',
//           accountKey: '',
//           containerName: ''
//         };
//         break;
//       case 'gcp_storage':
//         defaultConfig = {
//           bucketName: '',
//           projectId: '',
//           credentials: {}
//         };
//         break;
//       default:
//         defaultConfig = {};
//     }
    
//     setFormData({
//       ...formData,
//       type: type,
//       connectionConfig: defaultConfig
//     });
//   };

//   // Test connection
//   const handleTestConnection = async () => {
//     try {
//       setTesting(true);
      
//       // If editing, test existing source
//       if (editingSource) {
//         const result = await dataSourceService.testConnection(editingSource.id);
//         if (result.success) {
//           toast.success('Connection successful!');
//         } else {
//           toast.error(`Connection failed: ${result.message}`);
//         }
//       } else {
//         // For new sources, we'd need a test endpoint without saving
//         // For now, just validate fields
//         if (!formData.name || !formData.connectionConfig.host) {
//           toast.error('Please fill in required fields first');
//           return;
//         }
//         toast.info('Please save the data source first, then test connection');
//       }
//     } catch (error) {
//       toast.error('Connection test failed');
//       console.error(error);
//     } finally {
//       setTesting(false);
//     }
//   };

//   // Save data source (create or update)
//   const handleSave = async () => {
//     try {
//       // Validate required fields
//       if (!formData.name.trim()) {
//         toast.error('Name is required');
//         return;
//       }

//       if (editingSource) {
//         // Update existing
//         await dataSourceService.updateDataSource(editingSource.id, formData);
//         toast.success('Data source updated successfully');
//       } else {
//         // Create new
//         await dataSourceService.createDataSource(formData);
//         toast.success('Data source created successfully');
//       }
      
//       handleCloseModal();
//       loadDataSources(); // Reload list
//     } catch (error) {
//       toast.error(error || 'Failed to save data source');
//       console.error(error);
//     }
//   };

//   // Delete data source
//   const handleDelete = async (source) => {
//     if (!window.confirm(`Are you sure you want to delete "${source.name}"? This action cannot be undone.`)) {
//       return;
//     }

//     try {
//       await dataSourceService.deleteDataSource(source.id);
//       toast.success('Data source deleted successfully');
//       loadDataSources(); // Reload list
//     } catch (error) {
//       toast.error('Failed to delete data source');
//       console.error(error);
//     }
//   };

//   // Render connection config fields based on type
//   const renderConfigFields = () => {
//     switch(formData.type) {
//       case 'postgresql':
//       case 'mysql':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Host *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="host"
//                 value={formData.connectionConfig.host || ''}
//                 onChange={handleChange}
//                 placeholder="localhost"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Port *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="port"
//                 value={formData.connectionConfig.port || ''}
//                 onChange={handleChange}
//                 placeholder={formData.type === 'postgresql' ? '5432' : '3306'}
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Database *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="database"
//                 value={formData.connectionConfig.database || ''}
//                 onChange={handleChange}
//                 placeholder="my_database"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Username *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="username"
//                 value={formData.connectionConfig.username || ''}
//                 onChange={handleChange}
//                 placeholder="postgres"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Password *</Form.Label>
//               <Form.Control
//                 type="password"
//                 name="password"
//                 value={formData.connectionConfig.password || ''}
//                 onChange={handleChange}
//                 placeholder="••••••••"
//                 required
//               />
//               <Form.Text className="text-muted">
//                 Password is encrypted before storage
//               </Form.Text>
//             </Form.Group>
//           </>
//         );

//       case 'rest_api':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Base URL *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="baseUrl"
//                 value={formData.connectionConfig.baseUrl || ''}
//                 onChange={handleChange}
//                 placeholder="https://api.example.com"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>API Key</Form.Label>
//               <Form.Control
//                 type="password"
//                 name="apiKey"
//                 value={formData.connectionConfig.apiKey || ''}
//                 onChange={handleChange}
//                 placeholder="your-api-key"
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Additional Headers (JSON)</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={3}
//                 name="headers"
//                 value={JSON.stringify(formData.connectionConfig.headers || {}, null, 2)}
//                 onChange={(e) => {
//                   try {
//                     const headers = JSON.parse(e.target.value);
//                     setFormData({
//                       ...formData,
//                       connectionConfig: {
//                         ...formData.connectionConfig,
//                         headers
//                       }
//                     });
//                   } catch (err) {
//                     // Invalid JSON, ignore
//                   }
//                 }}
//                 placeholder='{"Authorization": "Bearer token"}'
//               />
//             </Form.Group>
//           </>
//         );

//       case 'aws_s3':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Bucket Name *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="bucketName"
//                 value={formData.connectionConfig.bucketName || ''}
//                 onChange={handleChange}
//                 placeholder="my-data-bucket"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Region *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="region"
//                 value={formData.connectionConfig.region || ''}
//                 onChange={handleChange}
//                 placeholder="us-east-1"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Access Key *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="accessKey"
//                 value={formData.connectionConfig.accessKey || ''}
//                 onChange={handleChange}
//                 placeholder="AKIAIOSFODNN7EXAMPLE"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Secret Key *</Form.Label>
//               <Form.Control
//                 type="password"
//                 name="secretKey"
//                 value={formData.connectionConfig.secretKey || ''}
//                 onChange={handleChange}
//                 placeholder="••••••••"
//                 required
//               />
//             </Form.Group>
//           </>
//         );

//       case 'azure_blob':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Account Name *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="accountName"
//                 value={formData.connectionConfig.accountName || ''}
//                 onChange={handleChange}
//                 placeholder="mystorageaccount"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Account Key *</Form.Label>
//               <Form.Control
//                 type="password"
//                 name="accountKey"
//                 value={formData.connectionConfig.accountKey || ''}
//                 onChange={handleChange}
//                 placeholder="••••••••"
//                 required
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Container Name *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="containerName"
//                 value={formData.connectionConfig.containerName || ''}
//                 onChange={handleChange}
//                 placeholder="data-container"
//                 required
//               />
//             </Form.Group>
//           </>
//         );

//       default:
//         return (
//           <Alert variant="info">
//             Select a data source type to configure connection details
//           </Alert>
//         );
//     }
//   };

//   return (
//     <Container fluid>
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h2>Data Sources</h2>
//         <Button variant="primary" onClick={handleOpenModal}>
//           <FaPlus className="me-2" />
//           Add Data Source
//         </Button>
//       </div>

//       {loading ? (
//         <div className="text-center py-5">
//           <Spinner animation="border" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </Spinner>
//         </div>
//       ) : (
//         <Row>
//           <Col>
//             <Card>
//               <Card.Body>
//                 {dataSources.length === 0 ? (
//                   <div className="text-center py-5">
//                     <FaDatabase size={50} className="text-muted mb-3" />
//                     <h5>No Data Sources Yet</h5>
//                     <p className="text-muted">
//                       Click "Add Data Source" to connect your first database or API
//                     </p>
//                   </div>
//                 ) : (
//                   <Table hover responsive>
//                     <thead>
//                       <tr>
//                         <th>Name</th>
//                         <th>Type</th>
//                         <th>Status</th>
//                         <th>Last Tested</th>
//                         <th>Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {dataSources.map((source) => (
//                         <tr key={source.id}>
//                           <td>
//                             <FaDatabase className="me-2" />
//                             {source.name}
//                           </td>
//                           <td>
//                             <Badge bg="info">{source.type}</Badge>
//                           </td>
//                           <td>
//                             {source.status === 'active' ? (
//                               <Badge bg="success">
//                                 <FaCheck className="me-1" />
//                                 Active
//                               </Badge>
//                             ) : (
//                               <Badge bg="secondary">
//                                 <FaTimes className="me-1" />
//                                 Inactive
//                               </Badge>
//                             )}
//                           </td>
//                           <td>
//                             {source.lastTestedAt 
//                               ? new Date(source.lastTestedAt).toLocaleString()
//                               : 'Never'}
//                           </td>
//                           <td>
//                             <Button 
//                               variant="outline-info" 
//                               size="sm" 
//                               className="me-2"
//                               onClick={() => handleTestConnection(source)}
//                               disabled={testing}
//                             >
//                               <FaVial className="me-1" />
//                               Test
//                             </Button>
//                             <Button 
//                               variant="outline-primary" 
//                               size="sm" 
//                               className="me-2"
//                               onClick={() => handleEditSource(source)}
//                             >
//                               <FaEdit className="me-1" />
//                               Edit
//                             </Button>
//                             <Button 
//                               variant="outline-danger" 
//                               size="sm"
//                               onClick={() => handleDelete(source)}
//                             >
//                               <FaTrash className="me-1" />
//                               Delete
//                             </Button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 )}
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       )}

//       {/* Add/Edit Data Source Modal */}
//       <Modal show={showModal} onHide={handleCloseModal} size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>
//             {editingSource ? 'Edit Data Source' : 'Add Data Source'}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Name *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="My Database"
//                 required
//               />
//               <Form.Text className="text-muted">
//                 A friendly name to identify this data source
//               </Form.Text>
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Type *</Form.Label>
//               <Form.Select
//                 name="type"
//                 value={formData.type}
//                 onChange={handleTypeChange}
//                 required
//               >
//                 <option value="postgresql">PostgreSQL</option>
//                 <option value="mysql">MySQL</option>
//                 <option value="rest_api">REST API</option>
//                 <option value="aws_s3">AWS S3</option>
//                 <option value="azure_blob">Azure Blob Storage</option>
//                 <option value="gcp_storage">GCP Storage</option>
//               </Form.Select>
//             </Form.Group>

//             <hr />
//             <h6 className="mb-3">Connection Details</h6>

//             {renderConfigFields()}
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           {editingSource && (
//             <Button 
//               variant="outline-info" 
//               onClick={handleTestConnection}
//               disabled={testing}
//             >
//               {testing ? (
//                 <>
//                   <Spinner as="span" animation="border" size="sm" className="me-2" />
//                   Testing...
//                 </>
//               ) : (
//                 <>
//                   <FaVial className="me-2" />
//                   Test Connection
//                 </>
//               )}
//             </Button>
//           )}
//           <Button variant="secondary" onClick={handleCloseModal}>
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={handleSave}>
//             {editingSource ? 'Update' : 'Create'} Data Source
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// }

// export default DataSourcesPage;