import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import '../../styles/ManageAlgoTypes.css';

const ManageAlgoTypes = ({ algoTypes, searchQuery, fetchAlgoTypes, adminService }) => {
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [inlineMaxHeight, setInlineMaxHeight] = useState(0);
  const inlineRef = useRef(null);
  const [createData, setCreateData] = useState({ name: '', description: '' });

  // Smooth expand/collapse
  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;
    let ro;
    if (showCreateInline) {
      const updateHeight = () => setInlineMaxHeight(el.scrollHeight + 16);
      requestAnimationFrame(updateHeight);
      ro = new ResizeObserver(() => updateHeight());
      ro.observe(el);
    } else {
      setInlineMaxHeight(0);
    }
    return () => { if (ro) ro.disconnect(); };
  }, [showCreateInline]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const name = createData.name.trim();
    const description = createData.description.trim();
    if (!name || !description) {
      toast.error('Please provide both name and description');
      return;
    }
    try {
      await adminService.createAlgoType({ name, description });
      await fetchAlgoTypes();
      setCreateData({ name: '', description: '' });
      setShowCreateInline(false);
      toast.success('Algorithm type created');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create algorithm type');
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
      <div className="manage-header">
        <h2>Manage Algorithm Types</h2>
        <button
          type="button"
          className="cta-button add-inline"
          onClick={() => setShowCreateInline((p) => !p)}
        >
          {showCreateInline ? 'Close' : 'Create Type'}
        </button>
      </div>

      <div
        className={`inline-add-form ${showCreateInline ? 'open' : ''}`}
        style={{ maxHeight: `${inlineMaxHeight}px` }}
      >
        {showCreateInline && (
          <div className="inline-form-content" ref={inlineRef}>
            <form className="create-type-form" onSubmit={handleCreateSubmit}>
              <input
                type="text"
                placeholder="Type Name"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={createData.description}
                onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                required
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="cta-button secondary"
                  onClick={() => setShowCreateInline(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cta-button primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th className="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAlgoTypes.length > 0 ? (
            filteredAlgoTypes.map((type) => (
              <tr key={type.id}>
                <td>{type.id}</td>
                <td>{type.name}</td>
                <td>{type.description}</td>
                <td className="actions">
                  <div className="table-actions">
                    <button onClick={() => updateAlgoType(type.id)} className="cta-button primary sm">
                      Edit
                    </button>
                    <button onClick={() => deleteAlgoType(type.id)} className="cta-button danger sm">
                      Delete
                    </button>
                  </div>
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