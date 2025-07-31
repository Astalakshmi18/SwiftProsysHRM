import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, deleteUser } from 'firebase/auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);
  const navigate = useNavigate();

  // Constants for filters
  const departments = [
    'IT', 'Human Resources', 'Finance', 'Operations', 'Marketing', 'Project Management'
  ];
  
  const branches = [
    'Tindivanam', 'Chennai', 'Kanchipuram', 'Madurai'
  ];

  const employmentStatuses = [
    'Active', 'Probation', 'Inactive', 'Terminated'
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        let q = query(collection(db, "employees"), orderBy("employeeid"));
        const snapshot = await getDocs(q);
        const empData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          experience: calculateDetailedExperience(doc.data().dateOfJoining),
          // Ensure all fields have default values
          aadharNumber: doc.data().aadharNumber || 'N/A',
          esiNumber: doc.data().esiNumber || 'N/A',
          panNumber: doc.data().panNumber || 'N/A',
          grossSalary: doc.data().grossSalary || 0,
          references: doc.data().references || [],
          enrollmentNumber: doc.data().enrollmentNumber || 'N/A',
          previousExperience: doc.data().previousExperience || 0,
          currentCompanyExperience: doc.data().currentCompanyExperience || 0,
          shiftTime: doc.data().shiftTime || 'N/A',
          qualifications: doc.data().qualifications || 'N/A',
          // Ensure existing fields have defaults
          employeeid: doc.data().employeeid || 'N/A',
          firstName: doc.data().firstName || 'N/A',
          lastName: doc.data().lastName || 'N/A',
          gender: doc.data().gender || 'N/A',
          dateOfBirth: doc.data().dateOfBirth || 'N/A',
          bloodGroup: doc.data().bloodGroup || 'N/A',
          maritalStatus: doc.data().maritalStatus || 'N/A',
          fatherOrHusbandName: doc.data().fatherOrHusbandName || 'N/A',
          department: doc.data().department || 'N/A',
          branch: doc.data().branch || 'N/A',
          dateOfJoining: doc.data().dateOfJoining || 'N/A',
          shift: doc.data().shift || 'N/A',
          position: doc.data().position || 'N/A',
          employmentStatus: doc.data().employmentStatus || 'N/A',
          casualLeave: doc.data().casualLeave || 0,
          email: doc.data().email || 'N/A',
          phone: doc.data().phone || 'N/A',
          emergencyContact: doc.data().emergencyContact || 'N/A',
          address: doc.data().address || 'N/A',
          accountNumber: doc.data().accountNumber || 'N/A',
          ifscCode: doc.data().ifscCode || 'N/A',
          salaryNet: doc.data().salaryNet || 0
        }));
        setEmployees(empData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Calculate detailed experience in years, months, days
  const calculateDetailedExperience = (joiningDate) => {
    if (!joiningDate) return 'N/A';
    
    const joinDate = new Date(joiningDate);
    const today = new Date();
    
    let years = today.getFullYear() - joinDate.getFullYear();
    let months = today.getMonth() - joinDate.getMonth();
    let days = today.getDate() - joinDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.employeeid?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment ? employee.department === filterDepartment : true;
    const matchesBranch = filterBranch ? employee.branch === filterBranch : true;
    const matchesStatus = filterStatus ? employee.employmentStatus === filterStatus.toLowerCase() : true;
    
    return matchesSearch && matchesDept && matchesBranch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEdit = (employeeid) => {
    navigate(`/admin/editempmodal/${employeeid}`);
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "employees", employeeToDelete.id));
      
      if (employeeToDelete.uid) {
        const auth = getAuth();
        await deleteUser(auth.currentUser, employeeToDelete.uid);
      }
      
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  const toggleExpand = (employeeid) => {
    setExpandedEmployee(expandedEmployee === employeeid ? null : employeeid);
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      // Personal Information
      'Employee ID', 'First Name', 'Last Name', 'Gender', 'Date of Birth', 
      'Blood Group', 'Marital Status', 'Father/Husband Name',
      // Employment Details
      'Department', 'Branch', 'Date of Joining', 'Experience', 'Shift', 'Shift Time',
      'Position', 'Employment Status', 'Previous Experience (years)', 
      'Current Company Experience (years)', 'Enrollment Number', 'Casual Leave', 'Qualifications',
      // Contact Information
      'Email', 'Phone', 'Emergency Contact', 'Address',
      // Financial Information
      'Aadhar Number', 'ESI Number', 'PAN Number', 'Account Number', 'IFSC Code',
      'Gross Salary', 'Salary (Net)',
      // References
      'Reference 1', 'Reference 2'
    ];

    const data = filteredEmployees.map(employee => [
      // Personal Information
      employee.employeeid,
      employee.firstName,
      employee.lastName,
      employee.gender,
      employee.dateOfBirth,
      employee.bloodGroup,
      employee.maritalStatus,
      employee.fatherOrHusbandName,
      // Employment Details
      employee.department,
      employee.branch,
      employee.dateOfJoining,
      employee.experience,
      employee.shift,
      employee.shiftTime,
      employee.position,
      employee.employmentStatus?.charAt(0).toUpperCase() + employee.employmentStatus?.slice(1),
      employee.previousExperience,
      employee.currentCompanyExperience,
      employee.enrollmentNumber,
      employee.casualLeave,
      employee.qualifications,
      // Contact Information
      employee.email,
      employee.phone,
      employee.emergencyContact,
      employee.address,
      // Financial Information
      employee.aadharNumber,
      employee.esiNumber,
      employee.panNumber,
      employee.accountNumber,
      employee.ifscCode,
      employee.grossSalary ? `₹${employee.grossSalary}` : '₹0',
      employee.salaryNet ? `₹${employee.salaryNet}` : '₹0',
      // References
      employee.references[0] || 'N/A',
      employee.references[1] || 'N/A'
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n'
      + data.map(row => row.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel function
  const exportToExcel = () => {
    const data = filteredEmployees.map(employee => ({
      // Personal Information
      'Employee ID': employee.employeeid,
      'First Name': employee.firstName,
      'Last Name': employee.lastName,
      'Gender': employee.gender,
      'Date of Birth': employee.dateOfBirth,
      'Blood Group': employee.bloodGroup,
      'Marital Status': employee.maritalStatus,
      'Father/Husband Name': employee.fatherOrHusbandName,
      // Employment Details
      'Department': employee.department,
      'Branch': employee.branch,
      'Date of Joining': employee.dateOfJoining,
      'Experience': employee.experience,
      'Shift': employee.shift,
      'Shift Time': employee.shiftTime,
      'Position': employee.position,
      'Employment Status': employee.employmentStatus?.charAt(0).toUpperCase() + employee.employmentStatus?.slice(1),
      'Previous Experience (years)': employee.previousExperience,
      'Current Company Experience (years)': employee.currentCompanyExperience,
      'Enrollment Number': employee.enrollmentNumber,
      'Casual Leave': employee.casualLeave,
      'Qualifications': employee.qualifications,
      // Contact Information
      'Email': employee.email,
      'Phone': employee.phone,
      'Emergency Contact': employee.emergencyContact,
      'Address': employee.address,
      // Financial Information
      'Aadhar Number': employee.aadharNumber,
      'ESI Number': employee.esiNumber,
      'PAN Number': employee.panNumber,
      'Account Number': employee.accountNumber,
      'IFSC Code': employee.ifscCode,
      'Gross Salary': employee.grossSalary ? `₹${employee.grossSalary}` : '₹0',
      'Salary (Net)': employee.salaryNet ? `₹${employee.salaryNet}` : '₹0',
      // References
      'Reference 1': employee.references[0] || 'N/A',
      'Reference 2': employee.references[1] || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
    saveAs(blob, `employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Employee Directory</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
                title="Export to CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                CSV
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
                title="Export to Excel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Excel
              </button>
            </div>
            <Link 
              to="/admin/addemployee" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Employee
            </Link>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 sm:mb-6">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <input
              type="text"
              placeholder="Search by ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border border-gray-300 px-2 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="border border-gray-300 px-2 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 px-2 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
          >
            <option value="">All Statuses</option>
            {employmentStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterDepartment('');
              setFilterBranch('');
              setFilterStatus('');
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base sm:col-start-5"
          >
            Clear All
          </button>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dept
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Experience
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <React.Fragment key={employee.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleExpand(employee.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedEmployee === employee.id ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.employeeid || 'N/A'}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">{employee.email || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.department ? employee.department.substring(0, 3) : 'N/A'}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {employee.experience ? employee.experience.split(',')[0] : 'N/A'}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${employee.employmentStatus === 'active' ? 'bg-green-100 text-green-800' :
                            employee.employmentStatus === 'probation' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {employee.employmentStatus?.charAt(0).toUpperCase() + employee.employmentStatus?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 sm:space-x-3">
                          <button
                            onClick={() => handleEdit(employee.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(employee)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedEmployee === employee.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="px-3 sm:px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            {/* Personal Information */}
                            <div>
                              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Personal Information</h3>
                              <div className="space-y-1 text-xs sm:text-sm">
                                <p><span className="text-gray-500">Employee ID:</span> {employee.employeeid || 'N/A'}</p>
                                <p><span className="text-gray-500">Gender:</span> {employee.gender || 'N/A'}</p>
                                <p><span className="text-gray-500">Date of Birth:</span> {employee.dateOfBirth || 'N/A'}</p>
                                <p><span className="text-gray-500">Blood Group:</span> {employee.bloodGroup || 'N/A'}</p>
                                <p><span className="text-gray-500">Marital Status:</span> {employee.maritalStatus || 'N/A'}</p>
                                <p><span className="text-gray-500">Father/Husband Name:</span> {employee.fatherOrHusbandName || 'N/A'}</p>
                              </div>
                            </div>
                            
                            {/* Employment Details */}
                            <div>
                              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Employment Details</h3>
                              <div className="space-y-1 text-xs sm:text-sm">
                                <p><span className="text-gray-500">Department:</span> {employee.department || 'N/A'}</p>
                                <p><span className="text-gray-500">Branch:</span> {employee.branch || 'N/A'}</p>
                                <p><span className="text-gray-500">Date of Joining:</span> {employee.dateOfJoining || 'N/A'}</p>
                                <p><span className="text-gray-500">Experience:</span> {employee.experience || 'N/A'}</p>
                                <p><span className="text-gray-500">Shift:</span> {employee.shift || 'N/A'}</p>
                                <p><span className="text-gray-500">Shift Time:</span> {employee.shiftTime || 'N/A'}</p>
                                <p><span className="text-gray-500">Position:</span> {employee.position || 'N/A'}</p>
                                <p><span className="text-gray-500">Previous Experience:</span> {employee.previousExperience || '0'} years</p>
                                <p><span className="text-gray-500">Current Company Experience:</span> {employee.currentCompanyExperience || '0'} years</p>
                                <p><span className="text-gray-500">Enrollment Number:</span> {employee.enrollmentNumber || 'N/A'}</p>
                                <p><span className="text-gray-500">Casual Leave:</span> {employee.casualLeave || '0'} days</p>
                                <p><span className="text-gray-500">Qualifications:</span> {employee.qualifications || 'N/A'}</p>
                              </div>
                            </div>
                            
                            {/* Contact & Financial */}
                            <div>
                              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Contact & Financial</h3>
                              <div className="space-y-1 text-xs sm:text-sm">
                                <p><span className="text-gray-500">Email:</span> {employee.email || 'N/A'}</p>
                                <p><span className="text-gray-500">Phone:</span> {employee.phone || 'N/A'}</p>
                                <p><span className="text-gray-500">Emergency Contact:</span> {employee.emergencyContact || 'N/A'}</p>
                                <p><span className="text-gray-500">Address:</span> {employee.address || 'N/A'}</p>
                                <p><span className="text-gray-500">Aadhar Number:</span> {employee.aadharNumber || 'N/A'}</p>
                                <p><span className="text-gray-500">ESI Number:</span> {employee.esiNumber || 'N/A'}</p>
                                <p><span className="text-gray-500">PAN Number:</span> {employee.panNumber || 'N/A'}</p>
                                <p><span className="text-gray-500">Account Number:</span> {employee.accountNumber || 'N/A'}</p>
                                <p><span className="text-gray-500">IFSC Code:</span> {employee.ifscCode || 'N/A'}</p>
                                <p><span className="text-gray-500">Gross Salary:</span> ₹{employee.grossSalary || '0'}</p>
                                <p><span className="text-gray-500">Salary (Net):</span> ₹{employee.salaryNet || '0'}</p>
                                <p><span className="text-gray-500">References:</span> 
                                  {employee.references?.length > 0 ? (
                                    <ul className="list-disc pl-5">
                                      {employee.references.map((ref, index) => (
                                        <li key={index}>{ref || 'N/A'}</li>
                                      ))}
                                    </ul>
                                  ) : ' N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || filterDepartment || filterBranch || filterStatus
                      ? "No employees match your search criteria" 
                      : "No employees found in the database"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredEmployees.length > employeesPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstEmployee + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastEmployee, filteredEmployees.length)}
              </span>{' '}
              of <span className="font-medium">{filteredEmployees.length}</span> results
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-1 rounded-md ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 py-1">...</span>
              )}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => paginate(totalPages)}
                  className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  {totalPages}
                </button>
              )}
              
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-4 text-sm sm:text-base">
              Are you sure you want to delete employee {employeeToDelete?.firstName} {employeeToDelete?.lastName}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 sm:px-4 py-1 sm:py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 sm:px-4 py-1 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;