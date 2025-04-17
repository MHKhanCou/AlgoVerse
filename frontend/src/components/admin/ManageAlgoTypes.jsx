import React from 'react';
import { toast } from 'react-toastify';

const ManageAlgoTypes = ({ algoTypes, searchQuery, fetchAlgoTypes, adminService }) => {
  const handleCreate = async () => {
    const name = prompt('Enter algorithm type name:');
    const description = prompt('Enter description:');
    if (name && description) {
      try {
        await adminService.createAlgoType({ name, description });
        await fetchAlgoTypes();
        toast.success('Algorithm type created');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to create algorithm type');
      }
    }
  };

  const updateAlgoType = async (typeId) => {
    const type = algoTypes.find((t) => t.id === typeId);
    const newName = prompt('Enter new name:', type.name);
    const newDescription = prompt('Enter new description:', type.description);
    if (newName && newDescription) {
      try {
        await adminService.updateAlgoType(typeId, { name: newName, description: newDescription });
        await fetchAlgoTypes();
        toast.success('Algorithm type updated');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to update algorithm type');
      }
    }
  };

  const deleteAlgoType = async (typeId) => {
    if (window.confirm('Are you sure you want to delete this algorithm type?')) {
      try {
        await adminService.deleteAlgoType(typeId);
        await fetchAlgoTypes();
        toast.success('Algorithm type deleted');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete algorithm type');
      }
    }
  };

  const filteredAlgoTypes = algoTypes.filter((type) =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="manage-section">
      <h2>Manage Algorithm Types</h2>
      <button onClick={handleCreate} className="action-btn create">
        Create New
      </button>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAlgoTypes.length > 0 ? (
            filteredAlgoTypes.map((type) => (
              <tr key={type.id}>
                <td>{type.id}</td>
                <td>{type.name}</td>
                <td>{type.description}</td>
                <td>
                  <button onClick={() => updateAlgoType(type.id)} className="action-btn edit">
                    Edit
                  </button>
                  <button onClick={() => deleteAlgoType(type.id)} className="action-btn delete">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No algorithm types found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ManageAlgoTypes;