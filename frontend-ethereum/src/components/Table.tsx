const TableHeader = (props) => {
  const { headers } = props;
  return(
  <thead className="thead-dark" key="header-1">
    <tr key="header-0">
      { headers && headers.map((value, index) => {
        return <th key={index}><div>{value}</div></th>
      })}
    </tr>
  </thead>
  );
}

const TableBody = (props) => {
  const { headers, rows } = props;
  const columns = headers ? headers.length : 0;
  const showSpinner = rows === null;

  function buildRow(row, headers) {
  return (
     <tr key={row.id}>
     { headers.map((value, index) => {
       return <td key={index}>{row[value]}</td>
      })}
     </tr>
   )
  };

  return(
  <tbody>
    {showSpinner &&
      <tr key="spinner-0">
        <td colSpan={columns} className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </td>
      </tr>
      }
    { !showSpinner && rows && rows.map((value) => {
        return buildRow(value, headers);
      })}
  </tbody>
  );
}

const Table = (props) => {
  const { headers, rows } = props;
  return (
  <div>
    <table className="table table-bordered table-hover">
    <TableHeader headers={headers}></TableHeader>
    <TableBody headers={headers} rows={rows}></TableBody>
    </table>
  </div>
  );
}
