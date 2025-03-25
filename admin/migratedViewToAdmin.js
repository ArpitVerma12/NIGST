const fs = require("fs");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const pool = require("../config/pool");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

exports.viewCorriPdfToAdmin = async (req, res) => {
  const { corrigendumID } = req.params;

  let client;

  try {
    client = await pool.connect();

    const query =
      "SELECT attachment FROM corrigendum_tender WHERE corri_id = $1";

    const result = await client.query(query, [corrigendumID]);

    if (result.rowCount === 0) {
      return res.status(404).send({ error: `PDF not found.` });
    }

    const fileUrl = result.rows[0].attachment;

    const corrigendumKey =
      "tender/corrigendum/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: corrigendumKey,
    });

    let response;

    try {
      response = await s3Client.send(getObjectCommand);
    } catch (error) {
      return res.status(404).send({ error: `Attachment file does not exist.` });
    }

    if (!response.Body) {
      return res.status(404).send({ error: `Attachment file does not exist.` });
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", `attachment; filename=${fileUrl}`);

    response.Body.pipe(res);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Something went wrong." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.viewArchiveCorriPdfToAdmin = async (req, res) => {
  let client;

  try {
    const { corrigendumID } = req.params;

    client = await pool.connect();

    const query =
      "SELECT attachment FROM archive_corrigendum WHERE corri_id = $1";

    const result = await client.query(query, [corrigendumID]);

    if (result.rowCount === 0) {
      return res.status(404).send({ error: `PDF not found.` });
    }

    const fileUrl = result.rows[0].attachment;

    const corrigendumKey =
      "tender/corrigendum/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: corrigendumKey,
    });

    let response;

    try {
      response = await s3Client.send(getObjectCommand);
    } catch (error) {
      return res.status(404).send({ error: `Attachment file does not exist.` });
    }

    if (!response.Body) {
      return res.status(404).send({ error: `Attachment file does not exist.` });
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", `attachment; filename=${fileUrl}`);

    response.Body.pipe(res);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Something went wrong." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.viewTenderToAdmin = async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const query = `
      SELECT 
        tender.id, 
        tender.title, 
        tender.description, 
        to_char(tender.start_date, 'MM/DD/YYYY') AS start_date, 
        to_char(tender.end_date, 'MM/DD/YYYY') AS end_date,
        tender.tender_ref_no, 
        array_agg(
          json_build_object(
            'corrigendumID', corrigendum_tender.corri_id,
            'corrigendum', corrigendum_tender.corrigendum,
            'pdf', corrigendum_tender.attachment,
            'created_at', to_char(corrigendum_tender.created_at, 'MM/DD/YYYY')
          )
        ) AS corrigenda
      FROM tender
      LEFT JOIN corrigendum_tender ON tender.tender_ref_no = corrigendum_tender.tender_ref_no
      GROUP BY tender.id
      ORDER BY tender.id DESC 
    `;

    const result = await client.query(query);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: "Nothing to show." });
    }

    return res.status(200).send({ tender: result.rows });
  } catch (error) {
    console.log(error);

    return res.status(500).send({ error: "Something went wrong." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.viewArchiveTenderToAdmin = async (req, res) => {
  let client;

  try {
    const check = `
      SELECT archive_tender.id, archive_tender.title, archive_tender.description, 
        to_char(archive_tender.start_date, 'MM/DD/YYYY') as startDate, 
        to_char(archive_tender.end_date, 'MM/DD/YYYY') as endDate, 
        archive_tender.tender_ref_no, 
        array_agg(
          json_build_object(
            'corrigendumID', archive_corrigendum.corri_id,
            'corrigendum', archive_corrigendum.corrigendum,
            'pdf', archive_corrigendum.attachment,
            'created_at', to_char(archive_corrigendum.created_at, 'MM/DD/YYYY')
          )
        ) AS corrigendum
      FROM archive_tender
      LEFT JOIN archive_corrigendum ON archive_tender.tender_ref_no = archive_corrigendum.tender_ref_no
      GROUP BY archive_tender.id
    `;

    client = await pool.connect();

    const result = await client.query(check);

    if (result.rowCount === 0) {
      return res.status(200).send({ message: "Nothing to show!" });
    } else {
      return res.status(200).send({ data: result.rows });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).send({ message: "Internal Server Error!" });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.viewPdfToAdmin = async (req, res) => {
  let client;

  try {
    const { tender_number } = req.params;

    client = await pool.connect();

    const query = "SELECT attachment FROM tender WHERE tender_ref_no = $1";

    const result = await client.query(query, [tender_number]);

    if (result.rowCount === 0) {
      return res.status(404).send({ error: `Tender not found.` });
    }

    const fileUrl = result.rows[0].attachment;

    const key = "tender/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      return res.status(404).send({ error: `File not found.` });
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", "inline; filename=tender.pdf");

    response.Body.pipe(res);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Something went wrong." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.viewArchivePdfToAdmin = async (req, res) => {
  let client;

  try {
    const { tender_number } = req.params;

    client = await pool.connect();

    const query =
      "SELECT attachment FROM archive_tender WHERE tender_ref_no = $1";

    const result = await client.query(query, [tender_number]);

    if (result.rowCount === 0) {
      return res.status(404).send({ error: `Tender not found.` });
    }

    const fileUrl = result.rows[0].attachment;

    const key = "tender/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      return res.status(404).send({ error: `File not found.` });
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", "inline; filename=tender.pdf");

    response.Body.pipe(res);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Something went wrong." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.viewImagesToAdmin = async (req, res) => {
  let connection;
  try {
    const allView =
      "SELECT a_id as id,path,visibility from about_section_image ";
    const connection = await pool.connect();
    const allImage = await connection.query(allView);
    if (allImage.rowCount === 0) {
      return res.status(404).send({ message: "No image Found" });
    }

    const imageData = [];

    for (const row of allImage.rows) {
      const { id, path, visibility } = row;
      const fileUrl = path;
      const key =
        "aboutImage/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

      try {
        const s3Client = new S3Client({
          region: process.env.BUCKET_REGION,
          credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
          },
        });

        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: key,
        });
        const path = await getSignedUrl(s3Client, command, {
          expiresIn: 36000,
        });

        imageData.push({ id, path, visibility });
      } catch (error) {
        console.error(`Error retrieving file '${key}': ${error}`);
      }
    }
    if (imageData.length === 0) {
      return res.status(404).send({ error: "Image not found." });
    }

    return res.send({ data: imageData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};
exports.viewStudiesToAdmin = async (req, res) => {
  let connection;
  try {
    const allStudies =
      "SELECT g_id as id, g_name as name, g_designation as designation,g_position as  position,path,visibility FROM board_of_studies";
    connection = await pool.connect();
    const alStudies = await connection.query(allStudies);
    if (alStudies.rowCount === 0) {
      return res.status(404).send({ message: "No image Found" });
    }
    const imageData = [];

    for (const row of alStudies.rows) {
      const { id, name, designation, position, path, visibility } = row;
      const fileUrl = path;
      const key = "studies/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

      try {
        const s3Client = new S3Client({
          region: process.env.BUCKET_REGION,
          credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
          },
        });

        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: key,
        });
        const path = await getSignedUrl(s3Client, command, {
          expiresIn: 36000,
        });

        imageData.push({ id, name, designation, position, path, visibility });
      } catch (error) {
        console.error(`Error retrieving file '${key}': ${error}`);
      }
    }
    if (imageData.length === 0) {
      return res.status(404).send({ error: "Image not found." });
    }

    return res.send({ data: imageData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

exports.getBannerToAdmin = async (req, res) => {
  let connection;

  try {
    connection = await pool.connect();

    const check =
      "SELECT alt,banner_path,url FROM banner ORDER BY date DESC LIMIT 2";
    const result = await connection.query(check);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: "Banner not found!" });
    }

    const banners = [];
    for (const row of result.rows) {
      const fileUrl = row.banner_path;
      const key = "banner/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

      // Generate a signed URL for the S3 object
      const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY,
          secretAccessKey: process.env.SECRET_ACCESS_KEY,
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 36000,
      });

      const bannerData = {
        signedUrl,
        url: row.url,
        alt: row.alt,
      };
      banners.push(bannerData);
    }

    return res.json({ banners });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal Server Error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};
