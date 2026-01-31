import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { FaChartLine, FaCheckCircle, FaDatabase, FaProjectDiagram } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dashboardService from '../services/dashboardService';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      
      // Load stats and activity in parallel
      const [statsData, activityData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getActivity(5)
      ]);
      
      console.log('Stats:', statsData);
      console.log('Activity:', activityData);
      
      setStats(statsData);
      setActivity(activityData);
      
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format duration
  const formatDuration = (start, end) => {
    if (!end) return 'Running...';
    const duration = new Date(end) - new Date(start);
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <div className="text-center py-5">
          <p className="text-muted">No data available</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">Dashboard</h2>

      {/* Statistics Cards */}
      <Row className="mb-4">

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaDatabase size={40} className="text-info mb-3" />
              <h3>{stats.totalDataSources}</h3>
              <p className="text-muted mb-0">Data Sources</p>
            </Card.Body>
          </Card>
        </Col>


        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaProjectDiagram size={40} className="text-primary mb-3" />
              <h3>{stats.totalPipelines}</h3>
              <p className="text-muted mb-0">Total Pipelines</p>
              <small className="text-success">
                {stats.activePipelines} active
              </small>
            </Card.Body>
          </Card>
        </Col>



        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaCheckCircle size={40} className="text-success mb-3" />
              <h3>{stats.totalExecutions}</h3>
              <p className="text-muted mb-0">Executions (30d)</p>
              <small className="text-success">
                {stats.successRate}% success rate
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaChartLine size={40} className="text-warning mb-3" />
              <h3>{stats.totalRecordsProcessed.toLocaleString()}</h3>
              <p className="text-muted mb-0">Records Processed</p>
              <small className="text-muted">Last 30 days</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Execution Details */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Execution Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Successful:</span>
                <span className="badge bg-success">{stats.successfulExecutions}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Failed:</span>
                <span className="badge bg-danger">{stats.failedExecutions}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Success Rate:</span>
                <span className="badge bg-primary">{stats.successRate}%</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* <Col md={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-grid gap-2">
                <a href="/pipelines/new" className="btn btn-primary">
                  Create New Pipeline
                </a>
                <a href="/data-sources/new" className="btn btn-outline-primary">
                  Add Data Source
                </a>
                <a href="/pipelines" className="btn btn-outline-secondary">
                  View All Pipelines
                </a>
              </div>
            </Card.Body>
          </Card>
        </Col> */}
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              {activity.length === 0 ? (
                <p className="text-muted text-center py-3">
                  No recent activity
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {activity.map(execution => (
                    <div 
                      key={execution.id} 
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{execution.Pipeline?.name || 'Unknown Pipeline'}</strong>
                        <br />
                        <small className="text-muted">
                          {formatDate(execution.startedAt)}
                        </small>
                      </div>
                      <div className="text-end">
                        <span className={`badge bg-${
                          execution.status === 'completed' ? 'success' : 
                          execution.status === 'failed' ? 'danger' : 
                          'warning'
                        }`}>
                          {execution.status}
                        </span>
                        <br />
                        <small className="text-muted">
                          {execution.recordsProcessed} records
                        </small>
                        <br />
                        <small className="text-muted">
                          {formatDuration(execution.startedAt, execution.completedAt)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;


// /**
//  * Dashboard Page
//  */

// import React, { useEffect, useState } from 'react';
// import { Button, Card, Col, Container, Row } from 'react-bootstrap';
// import { FaCheckCircle, FaDatabase, FaExclamationTriangle, FaProjectDiagram } from 'react-icons/fa';
// import { Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
// import dashboardService from '../services/dashboardService';

// function Dashboard() {
//   const [stats, setStats] = useState(null);
//   const [activity, setActivity] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       console.log('Loading dashboard data...');
      
//       // Load stats and activity in parallel
//       const [statsData, activityData] = await Promise.all([
//         dashboardService.getStats(),
//         dashboardService.getActivity(5)
//       ]);
      
//       console.log('Stats:', statsData);
//       console.log('Activity:', activityData);
      
//       setStats(statsData);
//       setActivity(activityData);
      
//     } catch (error) {
//       console.error('Failed to load dashboard:', error);
//       toast.error('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Format date for display
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
//   };

//   // Format duration
//   const formatDuration = (start, end) => {
//     if (!end) return 'Running...';
//     const duration = new Date(end) - new Date(start);
//     const seconds = Math.floor(duration / 1000);
//     if (seconds < 60) return `${seconds}s`;
//     const minutes = Math.floor(seconds / 60);
//     return `${minutes}m ${seconds % 60}s`;
//   };

//   if (loading) {
//     return (
//       <Container>
//         <div className="text-center py-5">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="mt-3">Loading dashboard...</p>
//         </div>
//       </Container>
//     );
//   }

//   if (!stats) {
//     return (
//       <Container>
//         <div className="text-center py-5">
//           <p className="text-muted">No data available</p>
//         </div>
//       </Container>
//     );
//   }

//   return (
//     <Container fluid>
//       <h2 className="mb-4">Dashboard</h2>

//       {/* Stats Cards */}
//       <Row className="mb-4">
//         <Col md={3}>
//           <Card className="text-center">
//             <Card.Body>
//               <FaDatabase size={40} className="text-primary mb-3" />
//               <h3>{stats.dataSources}</h3>
//               <p className="text-muted">Data Sources</p>
//               <Link to="/data-sources">
//                 <Button variant="outline-primary" size="sm">View All</Button>
//               </Link>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={3}>
//           <Card className="text-center">
//             <Card.Body>
//               <FaProjectDiagram size={40} className="text-success mb-3" />
//               <h3>{stats.pipelines}</h3>
//               <p className="text-muted">Active Pipelines</p>
//               <Link to="/pipelines">
//                 <Button variant="outline-success" size="sm">View All</Button>
//               </Link>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={3}>
//           <Card className="text-center">
//             <Card.Body>
//               <FaCheckCircle size={40} className="text-info mb-3" />
//               <h3>{stats.successRate}%</h3>
//               <p className="text-muted">Success Rate</p>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={3}>
//           <Card className="text-center">
//             <Card.Body>
//               <FaExclamationTriangle size={40} className="text-warning mb-3" />
//               <h3>{stats.issues}</h3>
//               <p className="text-muted">Active Issues</p>
//               <Link to="/quality">
//                 <Button variant="outline-warning" size="sm">View Issues</Button>
//               </Link>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Execution Trends Chart */}
//       <Row className="mb-4">
//         <Col>
//           <Card>
//             <Card.Header>
//               <h5>Pipeline Execution Trends (Last 7 Days)</h5>
//             </Card.Header>
//             <Card.Body>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Line type="monotone" dataKey="executions" stroke="#8884d8" name="Total Executions" />
//                   <Line type="monotone" dataKey="success" stroke="#82ca9d" name="Successful" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Recent Activity */}
//       <Row>
//         <Col md={6}>
//           <Card>
//             <Card.Header>
//               <h5>Recent Pipeline Executions</h5>
//             </Card.Header>
//             <Card.Body>
//               <div className="list-group list-group-flush">
//                 <div className="list-group-item d-flex justify-content-between">
//                   <span>Customer Data ETL</span>
//                   <span className="badge bg-success">Completed</span>
//                 </div>
//                 <div className="list-group-item d-flex justify-content-between">
//                   <span>Sales Analytics</span>
//                   <span className="badge bg-success">Completed</span>
//                 </div>
//                 <div className="list-group-item d-flex justify-content-between">
//                   <span>Inventory Sync</span>
//                   <span className="badge bg-danger">Failed</span>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={6}>
//           <Card>
//             <Card.Header>
//               <h5>Data Quality Alerts</h5>
//             </Card.Header>
//             <Card.Body>
//               <div className="list-group list-group-flush">
//                 <div className="list-group-item">
//                   <strong>Missing Values Detected</strong>
//                   <p className="text-muted mb-0">Customer table has 15 null email addresses</p>
//                 </div>
//                 <div className="list-group-item">
//                   <strong>Duplicate Records</strong>
//                   <p className="text-muted mb-0">5 duplicate orders found in orders table</p>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// }

// export default Dashboard;