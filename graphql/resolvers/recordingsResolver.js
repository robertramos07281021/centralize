import ftp from "basic-ftp";
import fs from "fs";
import "dotenv/config.js";
import Disposition from "../../models/disposition.js";
import CustomError from "../../middlewares/errors.js";
import path from "path";
import SftpClient from "ssh2-sftp-client";
import { safeResolver } from "../../middlewares/safeResolver.js";

const passwords = {
  "172.20.21.67": process.env.FTP_PASSWORD1,
  "172.20.21.165": process.env.FTP_PASSWORD1,
  "172.20.21.180": process.env.FTP_PASSWORD1,
  "172.20.21.105": process.env.FTP_PASSWORD1,
  "172.20.21.10": process.env.FTP_PASSWORD2,
  "172.20.21.74": process.env.FTP_PASSWORD1,
  "172.20.21.18": process.env.FTP_PASSWORD1,
  "172.20.21.35": process.env.FTP_PASSWORD1,
  "172.20.21.21": process.env.FTP_PASSWORD1,
  "172.20.21.20": process.env.FTP_PASSWORD1,
  "172.20.21.97": process.env.FTP_PASSWORD1,
  "172.20.21.17": process.env.FTP_PASSWORD1,
  "172.20.21.70": process.env.FTP_PASSWORD4,
  "171.20.21.20": process.env.FTP_PASSWORD1,
  "171.20.21.16": process.env.FTP_PASSWORD1,
  "172.20.21.64": process.env.FTP_PASSWORD4,
  "172.20.21.39": process.env.FTP_PASSWORD4,
  "172.20.21.76": process.env.FTP_PASSWORD4,
  "172.20.21.63": process.env.FTP_PASSWORD1,
  "172.20.21.196": process.env.FTP_PASSWORD1,
  "172.20.21.15": process.env.FTP_PASSWORD4,
  "172.20.21.91": process.env.FTP_PASSWORD1,
};

const fileNale = {
  "172.20.21.64": "AUTODIAL SHOPEE BCL-M7",
  "172.20.21.63": "MIXED CAMPAIGN",
  "172.20.21.10": "MIXED CAMPAIGN NEW 2",
  "172.20.21.17": "PSBANK",
  "172.20.21.27": "MIXED CAMPAIGN",
  "172.20.21.30": "MCC",
  "172.20.21.35": "MIXED CAMPAIGN",
  "172.20.21.67": "MIXED CAMPAIGN NEW",
  "172.20.21.97": "UB",
  "172.20.21.70": "AUTODIAL SHOPEE M3",
  "172.20.21.18": "MIXED CAMPAIGN NEW 2",
  "172.20.21.165": "PAGIBIGNCR",
  "172.20.21.105": "PAGIBIGPAM",
  "172.20.21.91": "AUTODIAL SHOPEE M2",
  "172.20.21.85": "AUTODIAL SHOPEE M4",
  "172.20.21.76": "AUTODIAL SHOPEE BCL-M7",
  "172.20.21.30": "MCC",
  "172.20.21.196": "ATOME NEW",
};

const recordingsResolver = {
  Query: {
    findLagRecording: safeResolver(async (_, { name, _id }) => {
      const client = new ftp.Client();
      try {
        const findDispo = await Disposition.findById(_id).populate({
          path: "customer_account",
          populate: {
            path: "bucket",
          },
        });
        if (!findDispo) {
          throw new CustomError("Disposition not found", 404);
        }

        if (!findDispo?.customer_account?.bucket) {
          throw new CustomError("Bucket information is missing", 404);
        }

        const createdAt = new Date(findDispo.createdAt);
        const yearCreated = createdAt.getFullYear();

        const dayCreated = createdAt.getDate();
        const month = createdAt.getMonth() + 1;
        const viciIpAddress = findDispo?.customer_account?.bucket?.viciIp;
        const bucketName = findDispo?.customer_account?.bucket?.name || "";

        function checkDate(number) {
          return number > 9 ? number : `0${number}`;
        }

        await client.access({
          host: process.env.FILEZILLA_HOST,
          user: process.env.FILEZILLA_USER,
          password: process.env.FILEZILLA_PASSWORD,
          port: 21,
          secure: false,
        });

        const viciFolder = fileNale[viciIpAddress];

        const remoteDirVici = `/REC-${viciIpAddress}-${
          [
            "CASH S2",
            "LAZCASH S1",
            "ACS1-TEAM 1",
            "ACS1-TEAM 2",
            "ACS1-TEAM 3",
          ].includes(bucketName)
            ? "ATOME"
            : viciFolder || "UNKNOWN"
        }/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`;

        const localDir = "./recordings";

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const isShopee =
          [
            "SHOPEE C1 M2",
            "SHOPEE C2 M2",
            "SHOPEE C1 M3",
            "SHOPEE C2 M3",
            "SHOPEE C1 M4",
            "SHOPEE C2 M4",
            "SHOPEE C1 M7",
            "SHOPEE C2 M7",
            "BCL-M2",
            "BCL-M3",
            "BCL-M4",
            "BCL-M7",
          ].includes(bucketName) &&
          createdAt.getMonth() < 12 &&
          dayCreated < 12
            ? `/REC-${fileNale["172.20.21.35"]}${yearCreated}-${checkDate(
                month
              )}-${checkDate(dayCreated)}`
            : remoteDirVici;

        const ifATOME =
          [
            "CASH S2",
            "LAZCASH S1",
            "ACS1-TEAM 1",
            "ACS1-TEAM 2",
            "ACS1-TEAM 3",
          ].includes(bucketName) &&
          createdAt.getMonth() < 7 &&
          dayCreated < 18
            ? `/REC-172.20.21.18-MIXED CAMPAIGN NEW 2/${yearCreated}-${checkDate(
                month
              )}-${checkDate(dayCreated)}`
            : isShopee;

        const remotePath = `${ifATOME}/${name}`;
        const files = await client.list(remotePath);
        return files[0].size;
      } finally {
        client.close();
      }
    }),
    findLagOnFTP: safeResolver(async (_, { name }) => {
      const sftp = new SftpClient();

      try {
        const REMOTE_DIR = "/var/spool/asterisk/monitorDONE";

        const localDir = "./recordings";

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const splitFileName = name.split(".mp3");
        const newFileName = splitFileName[0];
        const splitFileName2nd = splitFileName[1]
          ? splitFileName[1].split("_")[2]
          : "";

        const sftpConfig = {
          host: splitFileName2nd,
          port: 22,
          username: process.env.FTP_USERNAME,
          password: passwords[splitFileName2nd],
        };

        await sftp.connect(sftpConfig);

        function extractDateFolder(xfilename) {
          const match = xfilename.match(/_(\d{8})-/);

          if (!match) return null;

          const date = match[1];
          return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
        }

        const dateFolder = extractDateFolder(newFileName);
        let fileContent;

        try {
          fileContent = await sftp.get(`${REMOTE_DIR}/MP3/${newFileName}.mp3`);
        } catch (error1) {
          try {
            fileContent = await sftp.get(
              `${REMOTE_DIR}/FTP/${newFileName}.mp3`
            );
          } catch (error2) {
            if (!dateFolder) {
              throw new Error("Date not found in filename");
            }

            fileContent = await sftp.get(
              `${REMOTE_DIR}/ORIG/${dateFolder}/${newFileName}.wav`
            );
          }
        }

        return fileContent.length;
      } finally {
        await sftp.end();
      }
    }),
    cantFindOnFTP: safeResolver(async (_, { name }) => {
      const sftp = new SftpClient();

      try {
        const REMOTE_DIR = "/var/spool/asterisk/monitorDONE";

        const localDir = "./recordings";

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const splitFileName = name.split(".mp3");
        const newFileName = splitFileName[0];
        const splitFileName2nd = splitFileName[1]
          ? splitFileName[1].split("_")[2]
          : "";

        const sftpConfig = {
          host: splitFileName2nd,
          port: 22,
          username: process.env.FTP_USERNAME,
          password: passwords[splitFileName2nd],
        };

        await sftp.connect(sftpConfig);

        function extractDateFolder(xfilename) {
          const match = xfilename.match(/_(\d{8})-/);

          if (!match) return null;

          const date = match[1];
          return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
        }

        const dateFolder = extractDateFolder(newFileName);
        let fileContent;

        try {
          const res = await sftp.list(`${REMOTE_DIR}/MP3`);
          const nameSplice = newFileName.split("_");
          const findRecordings = res.filter(
            (x) =>
              x.name.includes(nameSplice[3]) && x.name.includes(nameSplice[4])
          );

          fileContent = findRecordings;
        } catch (error1) {
          try {
            const res = await sftp.list(`${REMOTE_DIR}/FTP`);
            const nameSplice = newFileName.split("_");

            const findRecordings = res.filter(
              (x) =>
                x.name.includes(nameSplice[3]) && x.name.includes(nameSplice[4])
            );
            fileContent = findRecordings;
          } catch (error2) {
            if (!dateFolder) {
              throw new Error("Date not found in filename");
            }

            const res = await sftp.list(`${REMOTE_DIR}/ORIG/${dateFolder}`);

            const nameSplice = newFileName.split("_");

            const findRecordings = res.filter(
              (x) =>
                x.name.includes(nameSplice[3]) && x.name.includes(nameSplice[4])
            );
            fileContent = findRecordings;
          }
        }

        return fileContent.map((x) => {
          return {
            name: x.name,
            size: x.size,
          };
        });
      } finally {
        await sftp.end();
      }
    }),
  },

  Mutation: {
    findRecordings: safeResolver(async (_, { name, _id, ccsCall }) => {
      const client = new ftp.Client();
      try {
        const fileNameNewMap = name.split(".mp3");
        const actualFileName = `${fileNameNewMap[0]}.mp3`;

        const fileIp = fileNameNewMap[2] ? fileNameNewMap[2].split("_")[2] : "";

        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const findDispo = await Disposition.findById(_id).populate({
          path: "customer_account",
          populate: {
            path: "bucket",
          },
        });
        if (!findDispo) {
          throw new CustomError("Disposition not found", 404);
        }

        if (!findDispo?.customer_account?.bucket) {
          throw new CustomError("Bucket information is missing", 404);
        }

        const createdAt = new Date(findDispo.createdAt);
        const yearCreated = createdAt.getFullYear();
        const monthCreated = months[createdAt.getMonth()];
        const dayCreated = createdAt.getDate();
        const month = createdAt.getMonth() + 1;
        const viciIpAddress = fileIp
          ? fileIp
          : findDispo?.customer_account?.bucket?.viciIp;
        const issabelIpAddress = findDispo?.customer_account?.bucket?.issabelIp;
        const bucketName = findDispo?.customer_account?.bucket?.name || "";

        const issabelNasFileBane = {
          "172.20.21.57": "ATOME CASH S1-ISSABEL_172.20.21.57",
          "172.20.21.32": "ATOME CASH S2-ISSABEL_172.20.21.32",
          "172.20.21.62": "AVON-ISSABEL_172.20.21.62",
          "172.20.21.72": "CIGNAL-ISSABEL_172.20.21.72",
          "172.20.21.50": "CTBC-ISSABEL_172.20.21.50",
        };

        function checkDate(number) {
          return number > 9 ? number : `0${number}`;
        }

        await client.access({
          host: process.env.FILEZILLA_HOST,
          user: process.env.FILEZILLA_USER,
          password: process.env.FILEZILLA_PASSWORD,
          port: 21,
          secure: false,
        });

        const viciFolder = fileNale[viciIpAddress];
        const remoteDirVici = `/REC-${viciIpAddress}-${
          [
            "CASH S2",
            "LAZCASH S1",
            "ACS1-TEAM 1",
            "ACS1-TEAM 2",
            "ACS1-TEAM 3",
          ].includes(bucketName)
            ? "ATOME"
            : viciFolder || "UNKNOWN"
        }/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`;
        const remoteDirIssabel = `/ISSABEL RECORDINGS/${
          issabelNasFileBane[issabelIpAddress] || "UNKNOWN"
        }/${monthCreated + " " + yearCreated}/${checkDate(dayCreated)}`;
        const localDir = "./recordings";

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const isShopee =
          [
            "SHOPEE C1 M2",
            "SHOPEE C2 M2",
            "SHOPEE C1 M3",
            "SHOPEE C2 M3",
            "SHOPEE C1 M4",
            "SHOPEE C2 M4",
            "SHOPEE C1 M7",
            "SHOPEE C2 M7",
            "BCL-M2",
            "BCL-M3",
            "BCL-M4",
            "BCL-M7",
          ].includes(bucketName) &&
          createdAt.getMonth() < 12 &&
          dayCreated < 12
            ? `/REC-${fileNale["172.20.21.35"]}${yearCreated}-${checkDate(
                month
              )}-${checkDate(dayCreated)}`
            : remoteDirVici;

        const ifATOME =
          [
            "CASH S2",
            "LAZCASH S1",
            "ACS1-TEAM 1",
            "ACS1-TEAM 2",
            "ACS1-TEAM 3",
          ].includes(bucketName) &&
          createdAt.getMonth() < 7 &&
          dayCreated < 18
            ? `/REC-172.20.21.18-MIXED CAMPAIGN NEW 2/${yearCreated}-${checkDate(
                month
              )}-${checkDate(dayCreated)}`
            : isShopee;

        const remoteDir =
          findDispo.dialer === "vici" || ccsCall
            ? ifATOME
            : `${remoteDirIssabel}`;
        const remotePath = `${remoteDir}/${actualFileName}`;
        const localPath = `./recordings/${actualFileName}`;
        await client.downloadTo(localPath, remotePath);
        const toDownload = `http://${process.env.MY_IP}:${process.env.PORT}/recordings/${actualFileName}`;

        return {
          success: true,
          url: toDownload,
          message: "Successfully downloaded",
        };
      } finally {
        client.close();
      }
    }),
    deleteRecordings: safeResolver(async (_, { filename }) => {
      const filePath = path.join("./recordings", filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          throw new CustomError(err.message, 500);
        }
      });

      return {
        success: true,
        message: "Successfully deleted",
      };
    }),
    recordingsFTP: safeResolver(async (_, { _id, fileName }) => {
      const sftp = new SftpClient();

      try {
        const REMOTE_DIR = "/var/spool/asterisk/monitorDONE";

        const localDir = "./recordings";

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const splitFileName = fileName.split(".mp3");
        const newFileName = splitFileName[0];
        const splitFileName2nd = splitFileName[1]
          ? splitFileName[1].split("_")[2]
          : "";

        const sftpConfig = {
          host: splitFileName2nd,
          port: 22,
          username: process.env.FTP_USERNAME,
          password: passwords[splitFileName2nd],
        };

        await sftp.connect(sftpConfig);

        function extractDateFolder(xfilename) {
          // finds 8-digit date like 20251219
          const match = xfilename.match(/_(\d{8})-/);

          if (!match) return null;

          const date = match[1]; // 20251219
          return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
        }

        const dateFolder = extractDateFolder(newFileName);
        let fileContent;
        let lastFileName;
        try {
          // 1️⃣ Try MP3
          fileContent = await sftp.get(`${REMOTE_DIR}/MP3/${newFileName}.mp3`);
          lastFileName = `${newFileName}.mp3`;
        } catch (error1) {
          try {
            // 2️⃣ Try FTP
            fileContent = await sftp.get(
              `${REMOTE_DIR}/FTP/${newFileName}.mp3`
            );
            lastFileName = `${newFileName}.mp3`;
          } catch (error2) {
            // 3️⃣ Try ORIG (WAV with date folder)
            if (!dateFolder) {
              throw new Error("Date not found in filename");
            }

            lastFileName = `${newFileName}.wav`;
            fileContent = await sftp.get(
              `${REMOTE_DIR}/ORIG/${dateFolder}/${newFileName}.wav`
            );
          }
        }

        const localPath = path.join(localDir, lastFileName);
        await fs.writeFileSync(localPath, fileContent);

        const toDownload = `http://${process.env.MY_IP}:${process.env.PORT}/recordings/${lastFileName}`;

        return {
          success: true,
          url: toDownload,
          message: "Successfully downloaded",
        };
      } finally {
        await sftp.end();
      }
    }),
  },
};

export default recordingsResolver;
