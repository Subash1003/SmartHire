import { useState } from 'react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ status, label, applications, onDropCard }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const applicationId = e.dataTransfer.getData('text/plain');
        if (applicationId) onDropCard(applicationId, status);
      }}
    >
      <div className="kanban-column__header">
        <span className="kanban-column__title">{label}</span>
        <span className="kanban-column__count">{applications.length}</span>
      </div>
      <div className="kanban-column__cards">
        {applications.map((application) => (
          <KanbanCard key={application._id} application={application} />
        ))}
        {applications.length === 0 && <p className="kanban-column__empty">No candidates</p>}
      </div>
    </div>
  );
}
