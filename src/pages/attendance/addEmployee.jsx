import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// Data for dropdowns (unchanged)
const departments = [
  { key: "Management", label: "Management" },
  { key: "Project_Management", label: "Project Management" },
  { key: "HR_and_Admin", label: "HR/Admin" },
  { key: "IT_and_Systems", label: "IT & Systems" },
  { key: "Vendor_Management", label: "Vendor Manager" },
  { key: "Quality_Management", label: "Quality Management" },
  { key: "Finance", label: "Finance" }
];

const branches = [
  { key: 'TDM', label: 'Tindivanam' },
  { key: 'Chennai', label: 'Chennai' },
  { key: 'Kanchipuram', label: 'Kanchipuram' },
  { key: 'Madurai', label: 'Madurai' }
];

const shifts = [
  { key: 'morning', label: 'Morning (9AM-6PM)' },
  { key: 'evening', label: 'Evening (2PM-11PM)' },
  { key: 'night', label: 'Night (10PM-7AM)' }
];

const maritalStatuses = [
  { key: 'single', label: 'Single' },
  { key: 'married', label: 'Married' },
  { key: 'divorced', label: 'Divorced' },
  { key: 'widowed', label: 'Widowed' }
];

const employmentStatuses = [
  { key: 'active', label: 'Active' },
  { key: 'probation', label: 'Probation' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'terminated', label: 'Terminated' }
];

const bloodGroups = [
  { key: 'A+', label: 'A+' },
  { key: 'A-', label: 'A-' },
  { key: 'B+', label: 'B+' },
  { key: 'B-', label: 'B-' },
  { key: 'AB+', label: 'AB+' },
  { key: 'AB-', label: 'AB-' },
  { key: 'O+', label: 'O+' },
  { key: 'O-', label: 'O-' }
];

const departmentPositionMap = {
  Management: [
    { key: "COO", label: "Chief Operating Officer" }
  ],

  Project_Management: [
    { key: "General_Manager", label: "General Manager" },
    { key: "Project_management", label: "Project Manager" },
    { key: "Asst_Project_management", label: "Assistant PM" },
    { key: "Final_Checker", label: "Project Leader" },
    { key: "Production", label: "Data Entry" },
    { key: "Quality", label: "Quality Control" },
    { key: "Quality_PR", label: "Proof Reader" },
    { key: "Random_Quality", label: "Random QA" }

  ],
  HR_and_Admin: [
    { key: "HR", label: "HR Manager" },
    { key: "AHR", label: "HR Executive" },
    { key: "AD", label: "Admin Assistant" },
    { key: "Basic_training", label: "Trainer" }
  ],
  IT_and_Systems: [
    { key: "Manager", label: "IT Manager" },
    { key: "Asst_Manager", label: "IT Assistant Manager" },
    { key: "System_Admin", label: "System Admin" },
    { key: "Software_team", label: "Software Engineer" },
    { key: "Support", label: "IT Support" }
  ],
  Quality_Management: [
    { key: "Quality_Manager", label: "Quality Manager" },
    { key: "Analyst", label: "Quality Analyst" }
  ],
  Finance: [
    { key: "Finance_management", label: "Finance Manager" },
    { key: "Account", label: "Accountant" },
    { key: "Billing", label: "Billing Executive" }
  ],
  Vendor_Management: [
    { key: "Vendor_management", label: "Vendor Manager" },
    { key: "Asst_Vendor", label: "Vendor Assistant" }
  ]
};

const AddEmployee = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [employee, setEmployee] = useState({
    // Personal Information
    idNumber: '',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    maritalStatus: '',
    fatherOrHusbandName: '',
    
    // Employment Information
    employeeid: '',
    department: '',
    position: '',
    branch: '',
    dateOfJoining: '',
    shift: '',
    shiftTime: '',
    employmentStatus: '',
    enrollmentNumber: '',
    qualifications: '',
    previousExperience: '',
    currentCompanyExperience: '',
    casualLeave: 0,
    
    // Contact Information
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    
    // Financial Information
    aadharNumber: '',
    panNumber: '',
    uanPfNumber: '',
    esiNumber: '',
    accountNumber: '',
    ifscCode: '',
    salaryGross: 0,
    salaryNet: 0,
    
    // References
    referredBy: '',
    reference1: '',
    reference2: '',
    
    // System Access
    password: '',
    role: 'user'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { position: "" } : {})
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (!isNaN(value)) {
      setEmployee(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const availablePositions = departmentPositionMap[employee.department] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const auth = getAuth();

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        employee.email,
        employee.password
      );

      const user = userCredential.user;

      // Prepare Firestore-safe data
      const { password, ...employeeData } = employee;

      await addDoc(collection(db, "employees"), {
        ...employeeData,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSuccessMessage("Employee registered successfully");
      setTimeout(() => {
        setSuccessMessage("");
        navigate('/admin/emplist');
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error.message);
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-6 mx-auto max-w-7xl">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <Link to="/admin/emplist" className="text-blue-600 hover:text-blue-800 mb-4 inline-block text-sm sm:text-base">
          ← Back to Employee List
        </Link>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-6">Add New Employee</h2>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm sm:text-base">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm sm:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ID Number*</label>
                <input
                  name="idNumber"
                  value={employee.idNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Name*</label>
                <input
                  name="firstName"
                  value={employee.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                <input
                  name="lastName"
                  value={employee.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Gender*</label>
                <select
                  name="gender"
                  value={employee.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Birth*</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={employee.dateOfBirth}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={employee.bloodGroup}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(group => (
                    <option key={group.key} value={group.key}>{group.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={employee.maritalStatus}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">Select Marital Status</option>
                  {maritalStatuses.map(status => (
                    <option key={status.key} value={status.key}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Father/Husband Name</label>
                <input
                  name="fatherOrHusbandName"
                  value={employee.fatherOrHusbandName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b pb-2">Employment Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employee ID*</label>
                <input
                  name="employeeid"
                  value={employee.employeeid}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Department*</label>
                <select
                  name="department"
                  value={employee.department}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.key} value={dept.key}>{dept.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Position*</label>
                <select
                  name="position"
                  value={employee.position}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Select Position</option>
                  {availablePositions.map(pos => (
                    <option key={pos.key} value={pos.key}>{pos.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Branch*</label>
                <select
                  name="branch"
                  value={employee.branch}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.key} value={branch.key}>{branch.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Joining*</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={employee.dateOfJoining}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select
                  name="shift"
                  value={employee.shift}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">Select Shift</option>
                  {shifts.map(shift => (
                    <option key={shift.key} value={shift.key}>{shift.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Shift Time</label>
                <input
                  name="shiftTime"
                  value={employee.shiftTime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employment Status*</label>
                <select
                  name="employmentStatus"
                  value={employee.employmentStatus}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Select Status</option>
                  {employmentStatuses.map(status => (
                    <option key={status.key} value={status.key}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                <input
                  name="enrollmentNumber"
                  value={employee.enrollmentNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                <input
                  name="qualifications"
                  value={employee.qualifications}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Previous Experience (years)</label>
                <input
                  type="number"
                  name="previousExperience"
                  value={employee.previousExperience}
                  onChange={handleNumberChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Current Company Experience (years)</label>
                <input
                  type="number"
                  name="currentCompanyExperience"
                  value={employee.currentCompanyExperience}
                  onChange={handleNumberChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Casual Leave Balance</label>
                <input
                  type="number"
                  name="casualLeave"
                  value={employee.casualLeave}
                  onChange={handleNumberChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={employee.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                <input
                  type="tel"
                  name="phone"
                  value={employee.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={employee.emergencyContact}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={employee.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b pb-2">Financial Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                <input
                  name="aadharNumber"
                  value={employee.aadharNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input
                  name="panNumber"
                  value={employee.panNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">UAN/PF Number</label>
                <input
                  name="uanPfNumber"
                  value={employee.uanPfNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ESI Number</label>
                <input
                  name="esiNumber"
                  value={employee.esiNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  name="accountNumber"
                  value={employee.accountNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input
                  name="ifscCode"
                  value={employee.ifscCode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
                <input
                  type="number"
                  name="salaryGross"
                  value={employee.salaryGross}
                  onChange={handleNumberChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Net Salary</label>
                <input
                  type="number"
                  name="salaryNet"
                  value={employee.salaryNet}
                  onChange={handleNumberChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* References Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b pb-2">References</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Referred By</label>
                <input
                  name="referredBy"
                  value={employee.referredBy}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reference 1 (College/Previous Company)</label>
                <input
                  name="reference1"
                  value={employee.reference1}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reference 2 (Relatives)</label>
                <input
                  name="reference2"
                  value={employee.reference2}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* System Access Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b pb-2">System Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password*</label>
                <input
                  name="password"
                  value={employee.password}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 sm:right-3 top-7 sm:top-8 text-gray-500 text-xs sm:text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role*</label>
                <select
                  name="role"
                  value={employee.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/emplist')}
              className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {isSubmitting ? 'Submitting...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
