const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// =============create===============================
exports.createGovernance = async (req, res) => {
  let connection;
  try {
    const { name, designation, position } = req.body;
    const image = req.files.image;
    const path = image[0].location;

    connection = await pool.connect();

    let GID = "G-" + generateNumericValue(7);
    const check = "SELECT * FROM board_of_governance WHERE g_id = $1";
    let result = await connection.query(check, [GID]);

    while (result.rowCount > 0) {
      GID = "G-" + generateNumericValue(7);
      result = await connection.query(check, [GID]);
    }
    const insertQuery =
      "INSERT INTO  board_of_governance (g_id, g_name,g_designation, g_position, path) VALUES ($1, $2, $3, $4, $5)";
    const data = [GID, name, designation, position, path];
    const result1 = await connection.query(insertQuery, data);

    return res.status(200).send({ message: "created successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .send({ message: "Error creating board of governance!!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};
//=======================================view data===================================

exports.viewGovernance = async (req, res) => {
  let connection;
  try {
    const allGovernance =
      "SELECT g_id as id, g_name as name, g_designation as designation, path, visibility FROM board_of_governance";
    connection = await pool.connect();
    const alGovern = await connection.query(allGovernance);
    if (alGovern.rowCount === 0) {
      return res.status(404).send({ message: "No image Found" });
    }

    const s3Client = new S3Client({
      region: process.env.BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });

    const imageData = await Promise.all(
      alGovern.rows.map(async (row) => {
        const { id, name, designation, path, visibility } = row;
        const fileUrl = path;
        const key =
          "governance/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

        try {
          const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 36000,
          });

          return { id, name, designation, path: signedUrl, visibility };
        } catch (error) {
          console.error(`Error retrieving file '${key}': ${error}`);
          return null; // Return null if there's an error
        }
      })
    );

    // Filter out any null results (due to errors)
    const validImageData = imageData.filter((item) => item !== null);

    if (validImageData.length === 0) {
      return res.status(404).send({ error: "Image not found." });
    }

    return res.send({ data: validImageData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

// =======================================view for web==========================================
exports.viewWebGovernance = async (req, res) => {
  let connection;
  try {
    const allGovernance =
      "SELECT g_id as id, g_name as name, g_designation as designation, path FROM board_of_governance WHERE visibility=true";
    connection = await pool.connect();
    const alGovern = await connection.query(allGovernance);
    if (alGovern.rowCount === 0) {
      return res.status(404).send({ message: "No image Found" });
    }
    const imageData = [];

    for (const row of alGovern.rows) {
      const { id, name, designation, position, path } = row;
      const fileUrl = path;
      const key =
        "governance/" + fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

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

        imageData.push({ id, name, designation, position, path });
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

//======================================UPDATE=========================================
exports.updateGovernance = async (req, res) => {
  let client;
  try {
    const { designation, position, name, id } = req.body;
    // console.log(req.body)
    const image = req.files.image;
    const path = image[0].location;
    const checkQuery = "SELECT * FROM board_of_governance WHERE g_id = $1";
    const updateQuery =
      "UPDATE board_of_governance SET g_name=$1, g_designation=$2,g_position=$3, path=$4  WHERE g_id = $5";

    client = await pool.connect();

    const checkResult = await client.query(checkQuery, [id]);
    if (checkResult.rowCount === 0) {
      return res.status(404).send({ message: "This Project Does Not Exist!" });
    }

    const governanceData = checkResult.rows[0];
    const {
      g_name: currentName,
      g_designation: currentCdesignation,
      g_position: currentPosition,
      path: currentPath,
    } = governanceData;

    const updateName = name || currentName;
    const updatedCdesignation = designation || currentCdesignation;
    const updatePath = path || currentPath;
    const updatePosition = position || currentPosition;
    await client.query(updateQuery, [
      updateName,
      updatedCdesignation,
      updatePath,
      updatePosition,
      id,
    ]);

    return res.status(200).send({ message: "Successfully Updated!" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// ==============================================update visibility========================================================
exports.updateVisibleGovernance = async (req, res) => {
  try {
    const { visibility, id } = req.body;

    const checkQuery = "SELECT * FROM board_of_governance WHERE g_id = $1";
    const updateQuery =
      "UPDATE board_of_governance SET visibility=$1  WHERE g_id = $2";

    const client = await pool.connect();

    try {
      const checkResult = await client.query(checkQuery, [id]);
      // console.log(checkResult)
      if (checkResult.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "This Project Does Not Exist!" });
      }

      const governanceData = checkResult.rows[0];
      const { visibility: currentVisibility } = governanceData;

      const updatedVisibility =
        visibility !== undefined ? visibility : currentVisibility;

      await client.query(updateQuery, [updatedVisibility, id]);
      return res.status(200).json({ message: "Successfully visible Updated!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error!" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

// =============================delete=======================

exports.deleteGovernance = async (req, res) => {
  let connection;
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .send({ message: "Please provide the Governance ID" });
    }
    connection = await pool.connect();
    const ExistanceID = "SELECT * FROM board_of_governance WHERE g_id=$1";
    const result = await connection.query(ExistanceID, [id]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "governance ID does not exist!" });
    }

    // Retrieve the file path from the database
    const filePathQuery = "SELECT path FROM board_of_governance WHERE g_id=$1";
    const filePathResult = await connection.query(filePathQuery, [id]);
    const filePath = filePathResult.rows[0].path;

    const delGovernance = "DELETE FROM board_of_governance WHERE g_id=$1";
    await connection.query(delGovernance, [id]);

    // Delete file from S3
    const s3Client = new S3Client({
      region: process.env.BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
    const key = filePath.substring(filePath.lastIndexOf("/") + 1);
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(deleteCommand);

    return res.status(200).send({ message: "Successfully Deleted!" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};
