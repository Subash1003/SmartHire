export default function DataTable({ columns, rows, rowKey, loading, emptyMessage = 'No records found.' }) {
  if (loading) {
    return (
      <div className="table-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="table-skeleton__row" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="table-scroll">
      <table className="table">
        <thead className="table__head">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="table__heading">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="table__row">
              {columns.map((col) => (
                <td key={col.key} className="table__cell">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
