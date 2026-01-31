import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { FaClock, FaEdit, FaEye, FaHistory, FaPause, FaPlay, FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dataSourceService from '../services/dataSourceService';
import pipelineService from '../services/pipelineService';

function PipelineList() {
  const navigate = useNavigate();
  
  // State
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load pipelines on mount
  useEffect(() => {
    loadPipelines();
    
    // Refresh every 30 seconds to get latest status
    const interval = setInterval(() => {
      loadPipelines();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Load all pipelines from backend
  const loadPipelines = async () => {
    try {
      setLoading(true);
      const data = await pipelineService.getPipelines();
      setPipelines(data);
    } catch (error) {
      toast.error('Failed to load pipelines');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

// Update handleExecute function
// const handleExecute = async (pipeline) => {
//   console.log('═══════════════════════════════════════════════════════════');
//   console.log('FRONTEND: Starting pipeline execution');
//   console.log('Pipeline ID:', pipeline.id);
//   console.log('Pipeline Name:', pipeline.name);
//   console.log('═══════════════════════════════════════════════════════════');

//   setExecuting({ ...executing, [pipeline.id]: true });
  
//   try {
//     const result = await pipelineService.executePipeline(pipeline.id);

//     console.log('═══════════════════════════════════════════════════════════');
//     console.log('FRONTEND: Received pipeline execution result');
//     console.log('Full result:', result);
//     console.log('downloadReady?', result.downloadReady);
//     console.log('downloadData?', !!result.downloadData);
//     console.log('downloadData.data length?', result.downloadData?.data?.length);
//     console.log('═══════════════════════════════════════════════════════════');

    
//     // Check if download is ready
//     if (result.downloadReady && result.downloadData) {
//       console.log('✓ Download is ready!');
//       console.log('Records to download:', result.downloadData.data.length);

//       const { data, config } = result.downloadData;
      
//       // Get destination data source to get format
//       const destNode = pipeline.config.nodes?.find(n => n.type === 'destination');
//       if (destNode) {
//         console.log('Destination node found?', !!destNode);
//         console.log('Destination node config:', destNode?.config);        
//         try {
//           console.log('Fetching destination data source...');
//           const destSource = await dataSourceService.getDataSource(destNode.config.dataSourceId);
//           console.log('Destination source:', destSource);
//           const format = destSource.connectionConfig.format || 'csv';
//           const fileName = destNode.config.fileName || 
//                           pipeline.name.replace(/[^a-z0-9]/gi, '_') || 
//                           'export';

//           const fullFileName = `${fileName}_${Date.now()}`;
          
//           console.log('═══════════════════════════════════════════════════════════');
//           console.log('FRONTEND: Triggering download');
//           console.log('File name:', fullFileName);
//           console.log('Format:', format);
//           console.log('Record count:', result.downloadData.data.length);
//           console.log('═══════════════════════════════════════════════════════════');


                          

//           // Trigger download
//           pipelineService.downloadAsFile(
//             result.downloadData.data,
//             fullFileName,
//             format,
//             destSource.connectionConfig
//           );
          
//           toast.success(`Pipeline executed! File downloaded: ${fileName}.${format}`);
//       }  catch (error) {
//           console.error('Download preparation error:', error);
//           toast.error('Pipeline executed but download failed: ' + error);
//         }
//       }   else {
//         console.error('✗ No destination node or dataSourceId found');
//         console.log('Pipeline config:', pipeline.config);
//         toast.error('Pipeline executed but destination not configured properly');
//       }
//     } else {
//       console.log('✗ Download not ready');
//       console.log('Reasons:');
//       console.log('  - downloadReady:', result.downloadReady);
//       console.log('  - has downloadData:', !!result.downloadData);
//       console.log('  - has data array:', !!result.downloadData?.data);      
//       toast.success(`Pipeline "${pipeline.name}" execution started!`);
//     }
    
//     // Reload pipelines after delay
//     setTimeout(() => {
//       loadPipelines();
//     }, 2000);
    
//   } catch (error) {
//     console.error('Download preparation error:', error);
//     toast.error(error || 'Failed to execute pipeline');
//     console.error(error);
//   } finally {
//     setExecuting({ ...executing, [pipeline.id]: false });
//   }
// };


const handleExecute = async (pipeline) => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║ FRONTEND: Execute Pipeline Clicked                        ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('Pipeline ID:', pipeline.id);
  console.log('Pipeline Name:', pipeline.name);
  console.log('Pipeline Config:', pipeline.config);
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  setExecuting({ ...executing, [pipeline.id]: true });
  
  try {
    console.log('Calling executePipeline API...');
    const result = await pipelineService.executePipeline(pipeline.id);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║ FRONTEND: API Response Received                           ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('Full result object:', result);
    console.log('Keys in result:', Object.keys(result));
    console.log('downloadReady?', result.downloadReady);
    console.log('downloadData exists?', !!result.downloadData);
    if (result.downloadData) {
      console.log('downloadData keys:', Object.keys(result.downloadData));
      console.log('downloadData.data exists?', !!result.downloadData.data);
      console.log('downloadData.data length?', result.downloadData.data?.length);
      console.log('downloadData.data sample:', result.downloadData.data?.[0]);
    }
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // Check for download
    if (result.downloadReady === true && result.downloadData && result.downloadData.data) {
      console.log('✓✓✓ DOWNLOAD READY DETECTED ✓✓✓');
      console.log('Proceeding with download...');
      
      // Get destination node
      const destNode = pipeline.config?.nodes?.find(n => n.type === 'destination');
      console.log('Destination node:', destNode);
      
      if (!destNode) {
        console.error('No destination node found!');
        toast.error('Pipeline configuration error: No destination node');
        return;
      }
      
      console.log('Destination config:', destNode.config);
      console.log('Data source ID:', destNode.config.dataSourceId);
      
      try {
        // Fetch data source
        console.log('Fetching data source...');
        const destSource = await dataSourceService.getDataSource(destNode.config.dataSourceId);
        console.log('Destination source received:', destSource);
        
        const format = destSource.connectionConfig?.format || 'csv';
        const fileName = destNode.config.fileName || 
                        pipeline.name.replace(/[^a-z0-9]/gi, '_') || 
                        'export';
        
        const timestamp = Date.now();
        const fullFileName = `${fileName}_${timestamp}`;
        
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ FRONTEND: Calling downloadAsFile                          ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log('File name:', fullFileName);
        console.log('Format:', format);
        console.log('Data length:', result.downloadData.data.length);
        console.log('Config:', destSource.connectionConfig);
        console.log('╚════════════════════════════════════════════════════════════╝');
        
        // TRIGGER DOWNLOAD
        pipelineService.downloadAsFile(
          result.downloadData.data,
          fullFileName,
          format,
          destSource.connectionConfig
        );
        
        toast.success(`✓ Downloaded ${result.recordsProcessed || result.downloadData.data.length} records`);
        
      } catch (error) {
        console.error('╔════════════════════════════════════════════════════════════╗');
        console.error('║ FRONTEND: Download Error                                  ║');
        console.error('╠════════════════════════════════════════════════════════════╣');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('╚════════════════════════════════════════════════════════════╝');
        toast.error('Download failed: ' + error.message);
      }
    } else {
      console.log('Download not ready:');
      console.log('  downloadReady:', result.downloadReady);
      console.log('  has downloadData:', !!result.downloadData);
      console.log('  has data array:', !!result.downloadData?.data);
      toast.success(`Pipeline executed successfully`);
    }
    
    // Reload pipelines
    setTimeout(() => {
      loadPipelines();
    }, 2000);
    
  } catch (error) {
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║ FRONTEND: Execute Pipeline Error                          ║');
    console.error('╠════════════════════════════════════════════════════════════╣');
    console.error('Error:', error);
    console.error('╚════════════════════════════════════════════════════════════╝');
    toast.error(error || 'Failed to execute pipeline');
  } finally {
    setExecuting({ ...executing, [pipeline.id]: false });
  }
};

  // Open edit page
  const handleEdit = (pipeline) => {
    navigate(`/pipelines/${pipeline.id}`);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (pipeline) => {
    setPipelineToDelete(pipeline);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!pipelineToDelete) return;

    try {
      await pipelineService.deletePipeline(pipelineToDelete.id);
      toast.success(`Pipeline "${pipelineToDelete.name}" deleted successfully`);
      setShowDeleteModal(false);
      setPipelineToDelete(null);
      loadPipelines(); // Reload list
    } catch (error) {
      toast.error('Failed to delete pipeline');
      console.error(error);
    }
  };

  // View execution history
  const handleViewHistory = async (pipeline) => {
    setSelectedPipeline(pipeline);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    
    try {
      const history = await pipelineService.getExecutions(pipeline.id, 10, 0);
      setExecutionHistory(history);
    } catch (error) {
      toast.error('Failed to load execution history');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'dark';
      default:
        return 'secondary';
    }
  };

  // Get execution status badge color
  const getExecutionStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`;
    
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ${diffMins % 60}m`;
  };

  // Get node count from pipeline config
  const getNodeCount = (pipeline) => {
    if (!pipeline.config || !pipeline.config.nodes) return 0;
    return pipeline.config.nodes.length;
  };

  return (
    <Container fluid>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Pipelines</h2>
          <p className="text-muted mb-0">
            {pipelines.length} pipeline{pipelines.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => navigate('/pipelines/new')}
        >
          <FaPlus className="me-2" />
          Create Pipeline
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading pipelines...</p>
        </div>
      ) : (
        <Row>
          <Col>
            <Card>
              <Card.Body>
                {/* Empty State */}
                {pipelines.length === 0 ? (
                  <div className="text-center py-5">
                    <FaPlus size={50} className="text-muted mb-3" />
                    <h5>No Pipelines Yet</h5>
                    <p className="text-muted mb-4">
                      Create your first pipeline to start processing data
                    </p>
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/pipelines/new')}
                    >
                      <FaPlus className="me-2" />
                      Create Your First Pipeline
                    </Button>
                  </div>
                ) : (
                  /* Pipeline Table */
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Nodes</th>
                        <th>Last Run</th>
                        <th>Last Status</th>
                        <th>Schedule</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelines.map((pipeline) => (
                        <tr key={pipeline.id}>
                          {/* Name & Description */}
                          <td>
                            <div>
                              <strong>{pipeline.name}</strong>
                              {pipeline.description && (
                                <div>
                                  <small className="text-muted">
                                    {pipeline.description.substring(0, 60)}
                                    {pipeline.description.length > 60 ? '...' : ''}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <Badge bg={getStatusColor(pipeline.status)}>
                              {pipeline.status || 'draft'}
                            </Badge>
                          </td>

                          {/* Node Count */}
                          <td>
                            <Badge bg="info">
                              {getNodeCount(pipeline)} node{getNodeCount(pipeline) !== 1 ? 's' : ''}
                            </Badge>
                          </td>

                          {/* Last Run */}
                          <td>
                            <small>{formatDate(pipeline.lastRunAt)}</small>
                          </td>

                          {/* Last Run Status */}
                          <td>
                            {pipeline.lastRunStatus ? (
                              <Badge bg={getExecutionStatusColor(pipeline.lastRunStatus)}>
                                {pipeline.lastRunStatus}
                              </Badge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>

                          {/* Schedule */}
                          <td>
                            {pipeline.schedule ? (
                              <small>
                                <FaClock className="me-1" />
                                {pipeline.schedule}
                              </small>
                            ) : (
                              <small className="text-muted">Manual</small>
                            )}
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                onClick={() => handleExecute(pipeline)}
                                disabled={executing[pipeline.id]}
                                title="Run pipeline"
                              >
                                {executing[pipeline.id] ? (
                                  <Spinner 
                                    as="span" 
                                    animation="border" 
                                    size="sm" 
                                  />
                                ) : (
                                  <FaPlay />
                                )}
                              </Button>
                              
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => handleViewHistory(pipeline)}
                                title="View execution history"
                              >
                                <FaHistory />
                              </Button>
                              
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleEdit(pipeline)}
                                title="Edit pipeline"
                              >
                                <FaEdit />
                              </Button>
                              
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteClick(pipeline)}
                                title="Delete pipeline"
                              >
                                <FaTrash />
                              </Button>
                            </div>
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Pipeline</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the pipeline <strong>"{pipelineToDelete?.name}"</strong>?
          </p>
          <p className="text-danger mb-0">
            <small>This action cannot be undone. All execution history will also be deleted.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Pipeline
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Execution History Modal */}
      <Modal 
        show={showHistoryModal} 
        onHide={() => setShowHistoryModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Execution History: {selectedPipeline?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingHistory ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2 text-muted">Loading execution history...</p>
            </div>
          ) : executionHistory.length === 0 ? (
            <div className="text-center py-4">
              <FaHistory size={40} className="text-muted mb-3" />
              <p className="text-muted">No executions yet</p>
              <small>Run this pipeline to see execution history</small>
            </div>
          ) : (
            <Table striped hover>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {executionHistory.map((execution) => (
                  <tr key={execution.id}>
                    <td>
                      <small>{new Date(execution.startedAt).toLocaleString()}</small>
                    </td>
                    <td>
                      <small>{formatDuration(execution.startedAt, execution.completedAt)}</small>
                    </td>
                    <td>
                      <Badge bg={getExecutionStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </td>
                    <td>
                      {execution.recordsProcessed || 0}
                    </td>
                    <td>
                      {execution.errorsCount > 0 ? (
                        <Badge bg="danger">{execution.errorsCount}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Info Card - Show when there are pipelines */}
      {!loading && pipelines.length > 0 && (
        <Row className="mt-4">
          <Col md={12}>
            <Card bg="light">
              <Card.Body>
                <h6>Quick Tips:</h6>
                <ul className="mb-0">
                  <li>
                    <FaPlay className="text-success me-2" />
                    Click the <strong>Play</strong> button to execute a pipeline manually
                  </li>
                  <li>
                    <FaHistory className="text-info me-2" />
                    Click the <strong>History</strong> button to view past executions
                  </li>
                  <li>
                    <FaEdit className="text-primary me-2" />
                    Click the <strong>Edit</strong> button to modify pipeline configuration
                  </li>
                  <li>
                    <FaClock className="text-warning me-2" />
                    Set a <strong>Schedule</strong> in the pipeline editor to run automatically
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default PipelineList;