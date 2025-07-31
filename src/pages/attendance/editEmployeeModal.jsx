// @ts-ignore
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useParams, useNavigate } from 'react-router-dom';

const EditEmployeeModal = () => {
  const { employeeid } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    employeeid: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    maritalStatus: '',
    fatherOrHusbandName: '',
    department: '',
    branch: '',
    dateOfJoining: '',
    employmentStatus: '',
    position: '',
    shift: '',
    shiftTime: '',
    previousExperience: '',
    currentCompanyExperience: '',
    enrollmentNumber: '',
    casualLeave: '',
    qualifications: '',
    phone: '',
    emergencyContact: '',
    address: '',
    aadharNumber: '',
    esiNumber: '',
    panNumber: '',
    accountNumber: '',
    ifscCode: '',
    grossSalary: '',
    salaryNet: '',
    references: ['', '']
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Data for dropdowns
  const departments = ['IT & System', 'HR/Admin', 'Finance', 'Vendor Manager', 'Quality Management', 'Project Management','Management'];
  const branches = ['Tindivanam', 'Chennai', 'Kanchipuram', 'Madurai'];
  const employmentStatuses = ['active', 'probation', 'inactive', 'terminated'];
  const genders = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  const positions = ["Chief Operating Officer", "General Manager", "Project Manager", "Assistant PM", "Project Leader", "Data Entry", "Quality Control", "Proof Reader", "Random QA", "HR Manager", "HR Executive", "Admin Assistant", "Trainer", "IT Manager", "IT Assistant Manager", "System Admin", "Software Engineer", "IT Support", "Quality Manager", "Quality Analyst", "Finance Manager", "Accountant", "Billing Executive", "Vendor Manager", "Vendor Assistant"];
  const shifts = ['Morning', 'Afternoon', 'Night', 'General'];
  const shiftTimes = ['9AM-5PM', '10AM-6PM', '2PM-10PM', '10PM-6AM'];

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        // @ts-ignore
        const docRef = doc(db, "employees", employeeid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // @ts-ignore
          setEmployee({
            ...data,
            references: data.references || ['', '']
          });
        } else {
          // @ts-ignore
          setError("Employee not found");
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
        // @ts-ignore
        setError("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReferenceChange = (index, value) => {
    const newReferences = [...employee.references];
    newReferences[index] = value;
    setEmployee(prev => ({
      ...prev,
      references: newReferences
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // @ts-ignore
      const docRef = doc(db, "employees", employeeid);
      await updateDoc(docRef, employee);
      
      setSuccessMessage("Employee updated successfully");
      setTimeout(() => {
        navigate('/admin/emplist');
      }, 1500);
    } catch (err) {
      console.error("Error updating employee:", err);
      // @ts-ignore
      setError("Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/admin/emplist')}
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Employee List
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Edit Employee Details</h2>
            <button 
              onClick={() => navigate('/admin/emplist')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg text-gray-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID*</label>
                  <input
                    type="text"
                    name="employeeid"
                    value={employee.employeeid}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={employee.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={employee.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={employee.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={employee.dateOfBirth}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={employee.bloodGroup}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={employee.maritalStatus}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Marital Status</option>
                    {maritalStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father/Husband Name</label>
                  <input
                    type="text"
                    name="fatherOrHusbandName"
                    value={employee.fatherOrHusbandName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg text-gray-800 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
                  <select
                    name="department"
                    value={employee.department}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch*</label>
                  <select
                    name="branch"
                    value={employee.branch}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining*</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={employee.dateOfJoining}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status*</label>
                  <select
                    name="employmentStatus"
                    value={employee.employmentStatus}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Status</option>
                    {employmentStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position*</label>
                  <select
                    name="position"
                    value={employee.position}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Position</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select
                    name="shift"
                    value={employee.shift}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Time</label>
                  <select
                    name="shiftTime"
                    value={employee.shiftTime}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Shift Time</option>
                    {shiftTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Experience (years)</label>
                  <input
                    type="number"
                    name="previousExperience"
                    value={employee.previousExperience}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Company Experience (years)</label>
                  <input
                    type="number"
                    name="currentCompanyExperience"
                    value={employee.currentCompanyExperience}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                  <input
                    type="text"
                    name="enrollmentNumber"
                    value={employee.enrollmentNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Casual Leave Balance</label>
                  <input
                    type="number"
                    name="casualLeave"
                    value={employee.casualLeave}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    name="qualifications"
                    value={employee.qualifications}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg text-gray-800 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={employee.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input
                    type="tel"
                    name="phone"
                    value={employee.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={employee.emergencyContact}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={employee.address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg text-gray-800 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={employee.aadharNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ESI Number</label>
                  <input
                    type="text"
                    name="esiNumber"
                    value={employee.esiNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={employee.panNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={employee.accountNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={employee.ifscCode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
                  <input
                    type="number"
                    name="grossSalary"
                    value={employee.grossSalary}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (Net)</label>
                  <input
                    type="number"
                    name="salaryNet"
                    value={employee.salaryNet}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* References */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg text-gray-800 mb-4">References</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference 1 (College/Previous Company)</label>
                  <input
                    type="text"
                    value={employee.references[0] || ''}
                    onChange={(e) => handleReferenceChange(0, e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference 2 (Relatives)</label>
                  <input
                    type="text"
                    value={employee.references[1] || ''}
                    onChange={(e) => handleReferenceChange(1, e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/emplist')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
