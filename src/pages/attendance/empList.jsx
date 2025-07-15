import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmployees from '../../hooks/useEmployees';
import { db } from '../../firebaseConfig';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EmployeeList = () => {
  const { employees } = useEmployees();
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;
  const navigate = useNavigate();

  const goToEmployees = () => navigate('/admin/addemployee');
  const handleSort = (key) => {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      await deleteDoc(doc(db, 'employees', id));
    }
  };

  const handleEdit = (id) => navigate(`/admin/addemployee?employeeid=${id}`);

  const exportToExcel = () => {
    const exportData = employees.map(emp => ({
      ID: emp.employeeid,
      Name: `${emp.firstName} ${emp.lastName}`,
      Email: emp.email,
      Phone: emp.phone,
      Position: emp.position,
      Department: emp.department,
      JoinDate: emp.joinDate,
      Role: emp.role,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'EmployeeList.xlsx');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(worksheet);
    for (const row of json) {
      const docRef = doc(db, 'employees', row.ID);
      await setDoc(docRef, {
        employeeid: row.ID,
        firstName: row.Name?.split(' ')[0] || '',
        lastName: row.Name?.split(' ')[1] || '',
        email: row.Email,
        phone: row.Phone,
        position: row.Position,
        department: row.Department,
        joinDate: row.JoinDate,
        role: row.Role,
        createdAt: new Date().toISOString(),
      });
    }
    alert('Bulk upload successful!');
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return (
      emp.employeeid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const valA = a[sortBy]?.toLowerCase?.() || '';
    const valB = b[sortBy]?.toLowerCase?.() || '';
    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  return (
    <div className="container-fluid bg-gray-100 px-0">
      <div className="bg-white p-3 rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Employee List</h2>
          <div className="flex space-x-2">
            <button onClick={exportToExcel} className="bg-green-500 text-white px-3 py-1 rounded">Export</button>
            <label className="bg-yellow-400 text-white px-3 py-1 rounded cursor-pointer">
              Upload
              <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={goToEmployees} className="bg-blue-500 text-white px-3 py-1 rounded">+ Add</button>
          </div>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name, ID, position or department"
          className="w-full border px-4 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />

        {filteredEmployees.length === 0 ? (
          <p className="text-gray-500">No matching employees found.</p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">S.No.</th>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Position</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Join Date</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedEmployees.map((emp, index) => (
                  <tr key={emp.employeeid}>
                    <td className="px-4 py-2">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-2">{emp.employeeid}</td>
                    <td className="px-4 py-2">{emp.firstName} {emp.lastName}</td>
                    <td className="px-4 py-2">{emp.position}</td>
                    <td className="px-4 py-2">{emp.department}</td>
                    <td className="px-4 py-2">{emp.phone}</td>
                    <td className="px-4 py-2">{emp.joinDate}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button onClick={() => handleEdit(emp.id)} className="text-blue-500">Edit</button>
                      <button onClick={() => handleDelete(emp.id)} className="text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
              <div className="space-x-2">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">
                  Previous
                </button>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
