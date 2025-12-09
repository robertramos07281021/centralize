import ftp from "basic-ftp";
import fs from "fs";
import "dotenv/config.js";
import Disposition from "../../models/disposition.js";
import CustomError from "../../middlewares/errors.js";
import path from "path";

const recordingsResolver = {
  Query: {
    findLagRecording: async (_, { name,_id }) => {
      const client = new ftp.Client();
      try {

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
        const viciIpAddress = findDispo.customer_account.bucket.viciIp;
        const issabelIpAddress = findDispo.customer_account.bucket.issabelIp;
        const bucketName = findDispo.customer_account.bucket.name || "";

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
          (findDispo.dialer === "vici" || !findDispo?.dialer) ? ifATOME : `${remoteDirIssabel}`;
        const remotePath = `${remoteDir}/${name}`;
        const files = await client.list(remotePath);
        return files[0].size;
      } catch (err) {
  
        throw new CustomError(err.message, 500);
      } finally {
        client.close();
      }
    },
  },

  Mutation: {
    findRecordings: async (_, { name, _id, ccsCall }) => {
      const client = new ftp.Client();
      try {
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
        const viciIpAddress = findDispo.customer_account.bucket.viciIp;
        const issabelIpAddress = findDispo.customer_account.bucket.issabelIp;
        const bucketName = findDispo.customer_account.bucket.name || "";

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
          (findDispo.dialer === "vici" || ccsCall) ? ifATOME : `${remoteDirIssabel}`;
        const remotePath = `${remoteDir}/${name}`;
        const localPath = `./recordings/${name}`;
        await client.downloadTo(localPath, remotePath);
        const toDownload = `http://${process.env.MY_IP}:4000/recordings/${name}`;
        
        return {
          success: true,
          url: toDownload,
          message: "Successfully downloaded",
        };
      } catch (err) {
        console.log(err)
        throw new CustomError(
          err.message || "Unable to download recording",
          500
        );
      } finally {
        client.close();
      }
    },
    deleteRecordings: (_, { filename }) => {
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
    },
  },
};

export default recordingsResolver;
