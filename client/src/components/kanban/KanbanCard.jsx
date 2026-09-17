import { Link } from 'react-router-dom';

export default function KanbanCard({ application }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', application._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="kanban-card" draggable onDragStart={handleDragStart}>
      <Link to={`/recruiter/applications/${application._id}`} className="kanban-card__name">
        {application.candidateId?.name}
      </Link>
      <p className="kanban-card__job">{application.jobId?.title}</p>
      <p className="kanban-card__date">{new Date(application.appliedAt).toLocaleDateString()}</p>
    </div>
  );
}
