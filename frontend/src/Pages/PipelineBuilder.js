import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaArrowRight, FaCheckCircle, FaDatabase, FaFilter, FaPlay, FaPlus, FaSave } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dataSourceService from '../services/dataSourceService';
import pipelineService from '../services/pipelineService';

function PipelineBuilder() {
  const { id } = useParams(); // If editing existing pipeline
  const navigate = useNavigate();
  
  // State
  const [pipelineName, setPipelineName] = useState('New Pipeline');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [nodes, setNodes] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  // Load data sources on mount
useEffect(() => {
  loadDataSources();
  
  // If we have an ID in the URL, load that pipeline
  if (id) {
    console.log('Pipeline ID from URL:', id);
    loadPipeline(id);
  } else {
    console.log('No pipeline ID - creating new pipeline');
  }
}, [id]);

  // Load data sources
  const loadDataSources = async () => {
    try {
      const sources = await dataSourceService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    }
  };

  // Load existing pipeline
const loadPipeline = async (pipelineId) => {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('Loading pipeline:', pipelineId);
    
    const pipeline = await pipelineService.getPipeline(pipelineId);
    
    console.log('Loaded pipeline:', pipeline);
    console.log('Pipeline name:', pipeline.name);
    console.log('Pipeline config:', pipeline.config);
    console.log('Pipeline nodes:', pipeline.config?.nodes);
    
    setPipelineName(pipeline.name);
    setPipelineDescription(pipeline.description || '');
    
    // Load nodes from config
    if (pipeline.config && pipeline.config.nodes) {
      console.log('Setting', pipeline.config.nodes.length, 'nodes');
      setNodes(pipeline.config.nodes);
    } else {
      console.log('No nodes found in pipeline config');
      setNodes([]);
    }
    
    console.log('═══════════════════════════════════════════');
    
  } catch (error) {
    console.error('Failed to load pipeline:', error);
    toast.error('Failed to load pipeline');
  }
};

  // Add node to canvas
  const handleAddNode = (nodeType) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodes.length + 1}`,
      config: getDefaultConfig(nodeType),
      position: nodes.length
    };

    setNodes([...nodes, newNode]);
    toast.success(`${nodeType} node added`);
  };

  // Get default configuration for node type
  const getDefaultConfig = (nodeType) => {
    switch (nodeType) {
      case 'source':
        return {
          dataSourceId: '',
          query: '',
          table: ''
        };
      case 'transform':
        return {
          transformType: 'filter',
          condition: '',
          code: ''
        };
      case 'validate':
        return {
          rules: []
        };
      case 'destination':
        return {
          dataSourceId: '',
          table: '',
          mode: 'replace'
        };
      default:
        return {};
    }
  };

  // Open node configuration
  const handleConfigureNode = (node) => {
    setSelectedNode(node);
    setShowNodeConfig(true);
  };

  // Update node configuration
  const handleUpdateNodeConfig = (config) => {
    const updatedNodes = nodes.map(node =>
      node.id === selectedNode.id
        ? { ...node, config }
        : node
    );
    setNodes(updatedNodes);
    setShowNodeConfig(false);
    toast.success('Node configuration updated');
  };

  // Delete node
  const handleDeleteNode = (nodeId) => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      setNodes(nodes.filter(node => node.id !== nodeId));
      toast.success('Node deleted');
    }
  };

  // Move node up
  const handleMoveNodeUp = (index) => {
    if (index === 0) return;
    const newNodes = [...nodes];
    [newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]];
    setNodes(newNodes);
  };

  // Move node down
  const handleMoveNodeDown = (index) => {
    if (index === nodes.length - 1) return;
    const newNodes = [...nodes];
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    setNodes(newNodes);
  };

  // Save pipeline
  const handleSave = async () => {
    if (!pipelineName.trim()) {
      toast.error('Pipeline name is required');
      return;
    }

    setSaving(true);
    try {
      const pipelineData = {
        name: pipelineName,
        description: pipelineDescription,
        config: {
          nodes: nodes,
          connections: [] // Will be implemented with visual editor
        }
      };

      if (id) {
        // Update existing
        await pipelineService.updatePipeline(id, pipelineData);
        toast.success('Pipeline updated successfully');
      } else {
        // Create new
        const result = await pipelineService.createPipeline(pipelineData);
        toast.success('Pipeline created successfully');
        navigate(`/pipelines/${result.pipeline.id}`);
      }
      
      setShowSaveModal(false);
    } catch (error) {
      toast.error(error || 'Failed to save pipeline');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Run pipeline
const handleRun = async () => {
  if (!id) {
    toast.error('Please save the pipeline first');
    return;
  }

  if (nodes.length === 0) {
    toast.error('Pipeline must have at least one node');
    return;
  }

  setRunning(true);
  
  try {
    console.log('═══════════════════════════════════════════');
    console.log('Pipeline Builder: Running pipeline');
    console.log('Pipeline ID:', id);
    console.log('═══════════════════════════════════════════');
    
    const result = await pipelineService.executePipeline(id);
    
    console.log('Pipeline execution result:', result);
    console.log('downloadReady?', result.downloadReady);
    console.log('Has downloadData?', !!result.downloadData);
    
    // Check if this is a local file download
    if (result.downloadReady === true && 
        result.downloadData && 
        result.downloadData.data && 
        Array.isArray(result.downloadData.data) &&
        result.downloadData.data.length > 0) {
      
      console.log('✓ DOWNLOAD READY - Processing...');
      
      // Get destination node
      const destNode = nodes.find(n => n.type === 'destination');
      
      if (destNode && destNode.config.dataSourceId) {
        try {
          // Fetch destination data source
          const destSource = await dataSourceService.getDataSource(destNode.config.dataSourceId);
          console.log('Destination source:', destSource);
          
          // Get format
          const format = destSource.connectionConfig?.format || 'csv';
          
          // Get file name
          const fileName = destNode.config.fileName || 
                          pipelineName.replace(/[^a-z0-9]/gi, '_') || 
                          'export';
          
          const fullFileName = `${fileName}_${Date.now()}`;
          
          console.log('═══════════════════════════════════════════');
          console.log('TRIGGERING DOWNLOAD');
          console.log('File name:', fullFileName);
          console.log('Format:', format);
          console.log('Records:', result.downloadData.data.length);
          console.log('═══════════════════════════════════════════');
          
          // Trigger download
          pipelineService.downloadAsFile(
            result.downloadData.data,
            fullFileName,
            format,
            destSource.connectionConfig || {}
          );
          
          toast.success(`✓ Pipeline executed! Downloaded ${result.downloadData.data.length} records as ${format.toUpperCase()}`);
          
        } catch (error) {
          console.error('Download error:', error);
          toast.error('Pipeline executed but download failed: ' + error.message);
        }
      } else {
        toast.error('Pipeline executed but destination not configured properly');
      }
      
    } else {
      toast.success('Pipeline execution completed! Check execution history for results.');
    }
    
  } catch (error) {
    toast.error(error || 'Failed to start pipeline execution');
    console.error(error);
  } finally {
    setRunning(false);
  }
};

  // Get node icon
  const getNodeIcon = (type) => {
    switch (type) {
      case 'source':
        return <FaDatabase className="text-primary" />;
      case 'transform':
        return <FaFilter className="text-info" />;
      case 'validate':
        return <FaCheckCircle className="text-warning" />;
      case 'destination':
        return <FaDatabase className="text-success" />;
      default:
        return null;
    }
  };

  // Get node color
  const getNodeColor = (type) => {
    switch (type) {
      case 'source':
        return 'primary';
      case 'transform':
        return 'info';
      case 'validate':
        return 'warning';
      case 'destination':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{pipelineName}</h2>
          <p className="text-muted mb-0">{pipelineDescription || 'No description'}</p>
        </div>
        <div>
          <Button 
            variant="outline-secondary" 
            className="me-2"
            onClick={() => navigate('/pipelines')}
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            className="me-2"
            onClick={() => setShowSaveModal(true)}
            disabled={saving}
          >
            <FaSave className="me-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button 
            variant="primary"
            onClick={handleRun}
            disabled={running || !id}
          >
            <FaPlay className="me-2" />
            {running ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>

      <Row>
        {/* Node Library Sidebar */}
        <Col md={3}>
          <Card>
            <Card.Header>
              <h5>Node Library</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={() => handleAddNode('source')}
                >
                  <FaDatabase className="me-2" />
                  Source
                </Button>
                <Button 
                  variant="outline-info" 
                  onClick={() => handleAddNode('transform')}
                >
                  <FaFilter className="me-2" />
                  Transform
                </Button>
                <Button 
                  variant="outline-warning" 
                  onClick={() => handleAddNode('validate')}
                >
                  <FaCheckCircle className="me-2" />
                  Validate
                </Button>
                <Button 
                  variant="outline-success" 
                  onClick={() => handleAddNode('destination')}
                >
                  <FaDatabase className="me-2" />
                  Destination
                </Button>
              </div>

              <hr />

              <h6 className="mt-3">Instructions:</h6>
              <small className="text-muted">
                1. Click a button to add a node<br />
                2. Configure each node<br />
                3. Nodes execute in order<br />
                4. Save when ready<br />
                5. Click Run to execute
              </small>
            </Card.Body>
          </Card>

          {dataSources.length > 0 && (
            <Card className="mt-3">
              <Card.Header>
                <h6>Available Data Sources</h6>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {dataSources.map(source => (
                    <ListGroup.Item key={source.id} className="px-0 py-2">
                      <small>
                        <FaDatabase className="me-2 text-primary" />
                        {source.name}
                        <Badge bg="info" className="ms-2" style={{ fontSize: '0.7rem' }}>
                          {source.type}
                        </Badge>
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Pipeline Canvas */}
        <Col md={9}>
          <Card style={{ minHeight: '600px' }}>
            <Card.Body>
              {nodes.length === 0 ? (
                <div className="text-center py-5">
                  <FaPlus size={50} className="text-muted mb-3" />
                  <h5>Empty Pipeline</h5>
                  <p className="text-muted">
                    Click buttons on the left to add nodes to your pipeline
                  </p>
                </div>
              ) : (
                <div>
                  <h5 className="mb-4">Pipeline Flow</h5>
                  
                  {nodes.map((node, index) => (
                    <div key={node.id} className="mb-3">
                      {/* Node Card */}
                      <Card border={getNodeColor(node.type)}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="me-3" style={{ fontSize: '1.5rem' }}>
                                {getNodeIcon(node.type)}
                              </div>
                              <div>
                                <h6 className="mb-0">{node.name}</h6>
                                <small className="text-muted">
                                  Type: {node.type}
                                </small>
                              </div>
                            </div>
                            
                            <div>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleMoveNodeUp(index)}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleMoveNodeDown(index)}
                                disabled={index === nodes.length - 1}
                              >
                                ↓
                              </Button>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleConfigureNode(node)}
                              >
                                Configure
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteNode(node.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          {/* Show basic config */}
                          {node.config && Object.keys(node.config).length > 0 && (
                            <div className="mt-2">
                              <small className="text-muted">
                                <strong>Config:</strong>{' '}
                                {JSON.stringify(node.config, null, 2).substring(0, 100)}...
                              </small>
                            </div>
                          )}
                        </Card.Body>
                      </Card>

                      {/* Arrow to next node */}
                      {index < nodes.length - 1 && (
                        <div className="text-center my-2">
                          <FaArrowRight className="text-muted" size={24} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Save Pipeline Modal */}
      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Save Pipeline</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Pipeline Name *</Form.Label>
              <Form.Control
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="My Pipeline"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={pipelineDescription}
                onChange={(e) => setPipelineDescription(e.target.value)}
                placeholder="What does this pipeline do?"
              />
            </Form.Group>

            <Alert variant="info">
              <small>
                <strong>Nodes:</strong> {nodes.length}
                {nodes.length === 0 && ' - Add at least one node before saving'}
              </small>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={saving || nodes.length === 0}
          >
            {saving ? 'Saving...' : 'Save Pipeline'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Node Configuration Modal */}
      <Modal 
        show={showNodeConfig} 
        onHide={() => setShowNodeConfig(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Configure {selectedNode?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNode && (
            <NodeConfigForm
              node={selectedNode}
              dataSources={dataSources}
              onSave={handleUpdateNodeConfig}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// Node Configuration Form Component
// function NodeConfigForm({ node, dataSources, onSave }) {
//   const [config, setConfig] = useState(node.config);

//   const handleChange = (field, value) => {
//     setConfig({
//       ...config,
//       [field]: value
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave(config);
//   };

//   // Render fields based on node type
//   const renderFields = () => {
//     switch (node.type) {
//       case 'source':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Data Source</Form.Label>
//               <Form.Select
//                 value={config.dataSourceId}
//                 onChange={(e) => handleChange('dataSourceId', e.target.value)}
//               >
//                 <option value="">Select a data source</option>
//                 {dataSources.map(source => (
//                   <option key={source.id} value={source.id}>
//                     {source.name} ({source.type})
//                   </option>
//                 ))}
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Table Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={config.table || ''}
//                 onChange={(e) => handleChange('table', e.target.value)}
//                 placeholder="customers"
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>SQL Query (optional)</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={3}
//                 value={config.query || ''}
//                 onChange={(e) => handleChange('query', e.target.value)}
//                 placeholder="SELECT * FROM customers WHERE status = 'active'"
//               />
//               <Form.Text className="text-muted">
//                 Leave empty to fetch all records from table
//               </Form.Text>
//             </Form.Group>
//           </>
//         );

//       case 'transform':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Transform Type</Form.Label>
//               <Form.Select
//                 value={config.transformType}
//                 onChange={(e) => handleChange('transformType', e.target.value)}
//               >
//                 <option value="filter">Filter</option>
//                 <option value="map">Map</option>
//                 <option value="aggregate">Aggregate</option>
//                 <option value="join">Join</option>
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Condition / Code</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={4}
//                 value={config.condition || config.code || ''}
//                 onChange={(e) => handleChange('condition', e.target.value)}
//                 placeholder="status = 'active' AND created_date > '2023-01-01'"
//               />
//             </Form.Group>
//           </>
//         );

//       case 'validate':
//         return (
//           <>
//             <Alert variant="info">
//               <small>
//                 Validation rules will check data quality.
//                 Add rules like "not null", "unique", "range", etc.
//               </small>
//             </Alert>
            
//             <Form.Group className="mb-3">
//               <Form.Label>Validation Rules (JSON)</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={6}
//                 value={JSON.stringify(config.rules || [], null, 2)}
//                 onChange={(e) => {
//                   try {
//                     const rules = JSON.parse(e.target.value);
//                     handleChange('rules', rules);
//                   } catch (err) {
//                     // Invalid JSON
//                   }
//                 }}
//                 placeholder={`[
//   {
//     "type": "not_null",
//     "field": "email",
//     "severity": "critical"
//   }
// ]`}
//               />
//             </Form.Group>
//           </>
//         );

//       case 'destination':
//         return (
//           <>
//             <Form.Group className="mb-3">
//               <Form.Label>Data Source</Form.Label>
//               <Form.Select
//                 value={config.dataSourceId}
//                 onChange={(e) => handleChange('dataSourceId', e.target.value)}
//               >
//                 <option value="">Select a data source</option>
//                 {dataSources.map(source => (
//                   <option key={source.id} value={source.id}>
//                     {source.name} ({source.type})
//                   </option>
//                 ))}
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Table Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={config.table || ''}
//                 onChange={(e) => handleChange('table', e.target.value)}
//                 placeholder="customers_clean"
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Write Mode</Form.Label>
//               <Form.Select
//                 value={config.mode}
//                 onChange={(e) => handleChange('mode', e.target.value)}
//               >
//                 <option value="replace">Replace (overwrite table)</option>
//                 <option value="append">Append (add to existing)</option>
//                 <option value="update">Update (upsert)</option>
//               </Form.Select>
//             </Form.Group>
//           </>
//         );

//       default:
//         return <Alert variant="warning">No configuration available for this node type</Alert>;
//     }
//   };

//   return (
//     <Form onSubmit={handleSubmit}>
//       {renderFields()}
      
//       <div className="d-flex justify-content-end mt-4">
//         <Button variant="primary" type="submit">
//           Save Configuration
//         </Button>
//       </div>
//     </Form>
//   );
// }

// Node Configuration Form Component - IMPROVED VERSION
function NodeConfigForm({ node, dataSources, onSave }) {
  const [config, setConfig] = useState(node.config);
  const [selectedSourceType, setSelectedSourceType] = useState('');

  // Update selected source type when data source changes
  useEffect(() => {
    if (config.dataSourceId) {
      const source = dataSources.find(s => s.id === config.dataSourceId);
      setSelectedSourceType(source?.type || '');
    }
  }, [config.dataSourceId, dataSources]);

  const handleChange = (field, value) => {
    setConfig({
      ...config,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(config);
  };

  // Get the selected data source
  const getSelectedSource = () => {
    return dataSources.find(s => s.id === config.dataSourceId);
  };

  // Render fields based on node type
  const renderFields = () => {
    switch (node.type) {
      case 'source':
        return renderSourceFields();
      case 'transform':
        return renderTransformFields();
      case 'validate':
        return renderValidateFields();
      case 'destination':
        return renderDestinationFields();
      default:
        return <Alert variant="warning">No configuration available for this node type</Alert>;
    }
  };

  // Render Source Node Fields
  const renderSourceFields = () => {
    const selectedSource = getSelectedSource();

    return (
      <>
        <Form.Group className="mb-3">
          <Form.Label>Data Source *</Form.Label>
          <Form.Select
            value={config.dataSourceId}
            onChange={(e) => handleChange('dataSourceId', e.target.value)}
            required
          >
            <option value="">Select a data source</option>
            {dataSources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name} ({source.type})
              </option>
            ))}
          </Form.Select>
          {dataSources.length === 0 && (
            <Form.Text className="text-muted">
              No data sources available. Please add one first.
            </Form.Text>
          )}
        </Form.Group>

        {selectedSource && renderSourceTypeSpecificFields(selectedSource.type)}
      </>
    );
  };

  // Render fields specific to data source type
  const renderSourceTypeSpecificFields = (sourceType) => {
    switch (sourceType) {
      case 'postgresql':
      case 'mysql':
        return (
          <>
          <Alert variant="info" className="mb-3">
            <small>
              <strong>Database Source:</strong> You can specify a table name or write a custom SQL query.
              <br />
              <strong>Important:</strong> Use double quotes for case-sensitive identifiers: 
              <code>SELECT "UserId" FROM "Users"</code>
            </small>
          </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Table Name</Form.Label>
              <Form.Control
                type="text"
                value={config.table || ''}
                onChange={(e) => handleChange('table', e.target.value)}
                placeholder="customers (use exact case)"
              />
              <Form.Text className="text-muted">
                The table to read from. Use exact case, e.g., "MyTable" not "mytable"
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>SQL Query (Optional - overrides table)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={config.query || ''}
                onChange={(e) => handleChange('query', e.target.value)}
                placeholder='SELECT "UserId", "FirstName", "LastName" FROM "Users" WHERE "Status" = active'
                style={{ fontFamily: 'monospace' }}
              />
            <Form.Text className="text-muted">
              Custom SQL query. Use double quotes for case-sensitive column/table names.
              Leave empty to fetch all records from table.
            </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Limit Rows (Optional)</Form.Label>
              <Form.Control
                type="number"
                value={config.limit || ''}
                onChange={(e) => handleChange('limit', e.target.value)}
                placeholder="1000"
              />
              <Form.Text className="text-muted">
                Maximum number of rows to fetch. Leave empty for all.
              </Form.Text>
            </Form.Group>
          </>
        );

      case 'rest_api':
        return (
          <>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>REST API Source:</strong> Specify the endpoint and parameters to fetch data from the API.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Endpoint / Path *</Form.Label>
              <Form.Control
                type="text"
                value={config.endpoint || ''}
                onChange={(e) => handleChange('endpoint', e.target.value)}
                placeholder="/products"
                required
              />
              <Form.Text className="text-muted">
                API endpoint path (e.g., /products, /users, /api/data)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>HTTP Method</Form.Label>
              <Form.Select
                value={config.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Query Parameters (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={config.queryParams || ''}
                onChange={(e) => handleChange('queryParams', e.target.value)}
                placeholder="limit=100&category=electronics"
              />
              <Form.Text className="text-muted">
                URL query parameters (e.g., limit=100&page=1)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Request Body (for POST/PUT - JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={config.requestBody || ''}
                onChange={(e) => handleChange('requestBody', e.target.value)}
                placeholder='{"key": "value"}'
              />
              <Form.Text className="text-muted">
                JSON body for POST/PUT requests
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Response Data Path (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={config.dataPath || ''}
                onChange={(e) => handleChange('dataPath', e.target.value)}
                placeholder="data.items"
              />
              <Form.Text className="text-muted">
                Path to array in JSON response (e.g., "data.results" or "items")
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pagination (Optional)</Form.Label>
              <Form.Check 
                type="checkbox"
                label="Enable pagination"
                checked={config.enablePagination || false}
                onChange={(e) => handleChange('enablePagination', e.target.checked)}
              />
              {config.enablePagination && (
                <div className="mt-2">
                  <Form.Control
                    type="text"
                    value={config.paginationParam || ''}
                    onChange={(e) => handleChange('paginationParam', e.target.value)}
                    placeholder="page"
                    className="mb-2"
                  />
                  <Form.Text className="text-muted">
                    Pagination parameter name (e.g., "page", "offset")
                  </Form.Text>
                </div>
              )}
            </Form.Group>
          </>
        );

      case 'aws_s3':
        return (
          <>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>AWS S3 Source:</strong> Specify the file or folder to read from S3.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>S3 Key / Path *</Form.Label>
              <Form.Control
                type="text"
                value={config.s3Key || ''}
                onChange={(e) => handleChange('s3Key', e.target.value)}
                placeholder="data/customers.csv"
                required
              />
              <Form.Text className="text-muted">
                Full path to file in S3 bucket
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Format</Form.Label>
              <Form.Select
                value={config.fileFormat || 'csv'}
                onChange={(e) => handleChange('fileFormat', e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="parquet">Parquet</option>
                <option value="txt">Text</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Delimiter (for CSV)</Form.Label>
              <Form.Control
                type="text"
                value={config.delimiter || ','}
                onChange={(e) => handleChange('delimiter', e.target.value)}
                placeholder=","
                maxLength={1}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="File has header row"
                checked={config.hasHeader !== false}
                onChange={(e) => handleChange('hasHeader', e.target.checked)}
              />
            </Form.Group>
          </>
        );

      case 'azure_blob':
        return (
          <>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>Azure Blob Source:</strong> Specify the blob to read from Azure storage.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Blob Name / Path *</Form.Label>
              <Form.Control
                type="text"
                value={config.blobName || ''}
                onChange={(e) => handleChange('blobName', e.target.value)}
                placeholder="data/customers.csv"
                required
              />
              <Form.Text className="text-muted">
                Path to blob in container
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Format</Form.Label>
              <Form.Select
                value={config.fileFormat || 'csv'}
                onChange={(e) => handleChange('fileFormat', e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="parquet">Parquet</option>
                <option value="txt">Text</option>
              </Form.Select>
            </Form.Group>
          </>
        );

      case 'gcp_storage':
        return (
          <>
            <Alert variant="info" className="mb-3">
              <small>
                <strong>GCP Storage Source:</strong> Specify the object to read from Google Cloud Storage.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Object Name / Path *</Form.Label>
              <Form.Control
                type="text"
                value={config.objectName || ''}
                onChange={(e) => handleChange('objectName', e.target.value)}
                placeholder="data/customers.csv"
                required
              />
              <Form.Text className="text-muted">
                Path to object in bucket
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Format</Form.Label>
              <Form.Select
                value={config.fileFormat || 'csv'}
                onChange={(e) => handleChange('fileFormat', e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="parquet">Parquet</option>
                <option value="txt">Text</option>
              </Form.Select>
            </Form.Group>
          </>
        );

      default:
        return (
          <Alert variant="warning">
            Please select a data source first
          </Alert>
        );
    }
  };

  // Render Transform Node Fields
  const renderTransformFields = () => {
    return (
      <>
        <Form.Group className="mb-3">
          <Form.Label>Transform Type</Form.Label>
          <Form.Select
            value={config.transformType}
            onChange={(e) => handleChange('transformType', e.target.value)}
          >
            <option value="filter">Filter - Keep only matching rows</option>
            <option value="map">Map - Transform columns</option>
            <option value="aggregate">Aggregate - Group and calculate</option>
            <option value="join">Join - Combine datasets</option>
            <option value="custom">Custom - Write your own code</option>
          </Form.Select>
        </Form.Group>

        {config.transformType === 'filter' && (
          <Form.Group className="mb-3">
            <Form.Label>Filter Condition</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={config.condition || ''}
              onChange={(e) => handleChange('condition', e.target.value)}
              placeholder="price > 50 AND category = 'electronics'"
            />
            <Form.Text className="text-muted">
              SQL-like condition to filter rows
            </Form.Text>
          </Form.Group>
        )}

        {config.transformType === 'map' && (
          <Form.Group className="mb-3">
            <Form.Label>Column Mappings (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={config.mappings || ''}
              onChange={(e) => handleChange('mappings', e.target.value)}
              placeholder={`{
  "full_name": "firstName + ' ' + lastName",
  "total": "price * quantity"
}`}
            />
            <Form.Text className="text-muted">
              Define new columns or transform existing ones
            </Form.Text>
          </Form.Group>
        )}

        {config.transformType === 'aggregate' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Group By Columns</Form.Label>
              <Form.Control
                type="text"
                value={config.groupBy || ''}
                onChange={(e) => handleChange('groupBy', e.target.value)}
                placeholder="category, brand"
              />
              <Form.Text className="text-muted">
                Comma-separated column names
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Aggregations (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={config.aggregations || ''}
                onChange={(e) => handleChange('aggregations', e.target.value)}
                placeholder={`{
  "total_sales": "SUM(amount)",
  "avg_price": "AVG(price)",
  "count": "COUNT(*)"
}`}
              />
            </Form.Group>
          </>
        )}

        {config.transformType === 'custom' && (
          <Form.Group className="mb-3">
            <Form.Label>Custom Code (JavaScript/Python)</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={config.code || ''}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder={`// Transform each row
data.map(row => ({
  ...row,
  fullName: row.firstName + ' ' + row.lastName
}))`}
            />
          </Form.Group>
        )}
      </>
    );
  };

  // Render Validate Node Fields
  const renderValidateFields = () => {
    return (
      <>
        <Alert variant="info">
          <small>
            Validation rules check data quality. Add rules to ensure your data meets requirements.
          </small>
        </Alert>
        
        <Form.Group className="mb-3">
          <Form.Label>Validation Rules (JSON)</Form.Label>
          <Form.Control
            as="textarea"
            rows={8}
            value={JSON.stringify(config.rules || [], null, 2)}
            onChange={(e) => {
              try {
                const rules = JSON.parse(e.target.value);
                handleChange('rules', rules);
              } catch (err) {
                // Invalid JSON - don't update
              }
            }}
            placeholder={`[
  {
    "type": "not_null",
    "field": "email",
    "severity": "critical"
  },
  {
    "type": "range",
    "field": "age",
    "min": 0,
    "max": 120,
    "severity": "warning"
  }
]`}
          />
          <Form.Text className="text-muted">
            Rule types: not_null, unique, range, format, custom
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Action on Validation Failure</Form.Label>
          <Form.Select
            value={config.onFailure || 'stop'}
            onChange={(e) => handleChange('onFailure', e.target.value)}
          >
            <option value="stop">Stop Pipeline</option>
            <option value="continue">Continue with Valid Rows</option>
            <option value="alert">Send Alert Only</option>
          </Form.Select>
        </Form.Group>
      </>
    );
  };

  // Render Destination Node Fields
  const renderDestinationFields = () => {
    const selectedSource = getSelectedSource();

    return (
      <>
        <Form.Group className="mb-3">
          <Form.Label>Data Source *</Form.Label>
          <Form.Select
            value={config.dataSourceId}
            onChange={(e) => handleChange('dataSourceId', e.target.value)}
            required
          >
            <option value="">Select a data source</option>
            {dataSources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name} ({source.type})
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {selectedSource && renderDestinationTypeSpecificFields(selectedSource.type)}
      </>
    );
  };

  // Render destination fields based on type
  const renderDestinationTypeSpecificFields = (sourceType) => {
    switch (sourceType) {
      case 'postgresql':
      case 'mysql':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Table Name *</Form.Label>
              <Form.Control
                type="text"
                value={config.table || ''}
                onChange={(e) => handleChange('table', e.target.value)}
                placeholder="customers_processed"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Write Mode</Form.Label>
              <Form.Select
                value={config.mode || 'replace'}
                onChange={(e) => handleChange('mode', e.target.value)}
              >
                <option value="replace">Replace - Drop and recreate table</option>
                <option value="append">Append - Add to existing records</option>
                <option value="update">Update - Upsert based on key</option>
              </Form.Select>
            </Form.Group>

            {config.mode === 'update' && (
              <Form.Group className="mb-3">
                <Form.Label>Primary Key Column(s)</Form.Label>
                <Form.Control
                  type="text"
                  value={config.primaryKey || ''}
                  onChange={(e) => handleChange('primaryKey', e.target.value)}
                  placeholder="id"
                />
                <Form.Text className="text-muted">
                  Column(s) to match for updates (comma-separated)
                </Form.Text>
              </Form.Group>
            )}
          </>
        );

      case 'local_file':
        return (
          <>
            <Alert variant="success" className="mb-3">
              <small>
                <strong>Local Download:</strong> When this pipeline runs, the results will 
                be downloaded to your browser as a file.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>File Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={config.fileName || ''}
                onChange={(e) => handleChange('fileName', e.target.value)}
                placeholder="my_export"
              />
              <Form.Text className="text-muted">
                File name without extension. Leave empty to use pipeline name.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Download automatically after execution"
                checked={config.autoDownload !== false}
                onChange={(e) => handleChange('autoDownload', e.target.checked)}
              />
            </Form.Group>
          </>
        );

      case 'rest_api':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>API Endpoint *</Form.Label>
              <Form.Control
                type="text"
                value={config.endpoint || ''}
                onChange={(e) => handleChange('endpoint', e.target.value)}
                placeholder="/api/data"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>HTTP Method</Form.Label>
              <Form.Select
                value={config.method || 'POST'}
                onChange={(e) => handleChange('method', e.target.value)}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Send data in batches"
                checked={config.useBatches || false}
                onChange={(e) => handleChange('useBatches', e.target.checked)}
              />
              {config.useBatches && (
                <Form.Control
                  type="number"
                  value={config.batchSize || 100}
                  onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
                  placeholder="100"
                  className="mt-2"
                />
              )}
            </Form.Group>
          </>
        );

      case 'aws_s3':
      case 'azure_blob':
      case 'gcp_storage':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>File Path *</Form.Label>
              <Form.Control
                type="text"
                value={config.filePath || ''}
                onChange={(e) => handleChange('filePath', e.target.value)}
                placeholder="output/data.csv"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Format</Form.Label>
              <Form.Select
                value={config.fileFormat || 'csv'}
                onChange={(e) => handleChange('fileFormat', e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="parquet">Parquet</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Write Mode</Form.Label>
              <Form.Select
                value={config.mode || 'overwrite'}
                onChange={(e) => handleChange('mode', e.target.value)}
              >
                <option value="overwrite">Overwrite</option>
                <option value="append">Append</option>
              </Form.Select>
            </Form.Group>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {renderFields()}
      
      <div className="d-flex justify-content-end mt-4">
        <Button variant="primary" type="submit">
          Save Configuration
        </Button>
      </div>
    </Form>
  );
}

export default PipelineBuilder;