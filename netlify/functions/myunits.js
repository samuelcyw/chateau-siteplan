const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // GET: Fetch all units
    if (method === 'GET') {
      const res = await pool.query('SELECT * FROM units ORDER BY id');
      return { statusCode: 200, body: JSON.stringify(res.rows) };
    }

    // POST: Add a new unit
    if (method === 'POST') {
      const { block, unitid, status, customer_name, reserved_date, sold_price, bedroom, reservation_agreement, deposit_record, id_doc } = body;
      await pool.query(
        'INSERT INTO units(block, unitid, status, customer_name, reserved_date, sold_price, bedroom, reservation_agreement, deposit_record, id_doc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [block, unitid, status, customer_name, reserved_date, sold_price, bedroom, reservation_agreement, deposit_record, id_doc]
      );
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // PUT: Edit/update a unit (only fields provided will update)
    if (method === 'PUT') {
      const { id, ...fields } = body;
      const keys = Object.keys(fields);
      if (!id || keys.length === 0) {
        return { statusCode: 400, body: "Missing id or fields" };
      }
      const sets = keys.map((k, i) => `${k}=$${i + 1}`).join(',');
      const values = keys.map(k => fields[k]);
      values.push(id);
      await pool.query(`UPDATE units SET ${sets} WHERE id=$${values.length}`, values);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // DELETE is disabled
    // if (method === 'DELETE') {
    //   return { statusCode: 405, body: "Delete not allowed" };
    // }

    return { statusCode: 405, body: "Method not allowed" };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
