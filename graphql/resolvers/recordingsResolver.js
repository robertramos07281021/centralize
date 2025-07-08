
import ftp from "basic-ftp"
import fs from "fs";
import 'dotenv/config.js'
import mongoose from "mongoose";
import Disposition from "../../models/disposition.js";
import CustomError from "../../middlewares/errors.js";
import path from "path";

const recordingsResolver = {
  Mutation: {
    findRecordings: async(_,{id}) => {
      const client = new ftp.Client();
      try {
        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ]
        const findDispo = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            }
          },
          {
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "bucket",
            }
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "customers",
              localField: "ca.customer",
              foreignField: "_id",
              as: "customer",
            }
          },
          {
            $unwind: { path: "$customer", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true}
          },
          {
            $match: {
              _id: new mongoose.Types.ObjectId(id)
            }
          }
        ])

        const myDispo = findDispo[0]

        const createdAt = new Date(myDispo.createdAt)
        const yearCreated = createdAt.getFullYear()
        const monthCreated = months[createdAt.getMonth()]
        const dayCreated = createdAt.getDate()
        const contact = myDispo.customer.contact_no
        const issabelIpAddress = myDispo.bucket.issableIp
        const month = createdAt.getMonth() + 1;

        const viciIpAddress = myDispo.bucket.viciIp
          const fileNale = {
          "172.20.21.64" : "HOMECREDIT",
          "172.20.21.10" : "MIXED CAMPAIGN NEW 2",
          "172.20.21.17" : "PSBANK",
          "172.20.21.27" : "MIXED CAMPAIGN",
          "172.20.21.30" : "MCC",
          "172.20.21.35" : "MIXED CAMPAIGN",
          "172.20.21.67" : "MIXED CAMPAIGN NEW",
          '172.20.21.97' : "UB"
        }

        function checkDate(number) {
          return number > 9 ? number : `0${number}`;
        }

        const contactPatterns = contact.map(num => {
          return num.length < 11 ? num : num.slice(1, 11); 
        });

        await client.access({
          host: process.env.FILEZILLA_HOST,
          user: process.env.FILEZILLA_USER,
          password: process.env.FILEZILLA_PASSWORD,
          port: 21,
          secure: false,
        });



        const remoteDirVici =  `/REC-${viciIpAddress}-${fileNale[viciIpAddress]}/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`     
        const remoteDirIssabel = `/ISSABEL RECORDINGS/ISSABEL_${issabelIpAddress}/${yearCreated}/${monthCreated + ' ' + yearCreated}/${dayCreated}`
        const localDir = './recordings'
        
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const remoteDir = myDispo.dialer === "vici" ? remoteDirVici : remoteDirIssabel
        const fileList = await client.list(remoteDir);
        
        const files = fileList.filter(e=> contactPatterns.some(pattern => e.name.includes(pattern)))
        
        function extractTimeFromFilename(filename) {
          const match = filename.match(/-(\d{6})_/);
          if (!match) return null;

          const timeStr = match[1];
          const hours = parseInt(timeStr.slice(0, 2), 10);
          const minutes = parseInt(timeStr.slice(2, 4), 10);
          const seconds = parseInt(timeStr.slice(4, 6), 10);

          return new Date(0, 0, 0, hours, minutes, seconds).getTime();
        }

        function getTimeOnly(date) {
          return new Date(0, 0, 0, date.getHours(), date.getMinutes(), date.getSeconds()).getTime();
        }

        function findClosestRecording(files, dispoCreatedAt) {
          const dispoTime = getTimeOnly(new Date(dispoCreatedAt));

          let bestMatch = null;
          let minDiff = Infinity;

          for (const file of files) {
            const recTime = extractTimeFromFilename(file.name);
            if (!recTime) continue;

            const diff = Math.abs(dispoTime - recTime);
            if (diff < minDiff) {
              minDiff = diff;
              bestMatch = file;
            }
          }
          return bestMatch
        }
        const bestMatch = findClosestRecording(files,myDispo.createdAt)
        if (bestMatch.type === ftp.FileType.File) {
          const remotePath = `${remoteDir}/${bestMatch.name}`;
          const fileName = `${myDispo.dispotype.code}-${bestMatch.name}`
          const localPath = `./recordings/${fileName}`;
          await client.downloadTo(localPath, remotePath);
          const toDownload = `http://${process.env.MY_IP}:4000/recordings/${fileName}`
       
          return {
            success: true,
            url: toDownload,
            message: "Successfully downloaded"
          }
        }


      } catch (err) {
        throw new CustomError(err.message, 500)
      } finally {
        client.close();
      }
    },
    deleteRecordings: (_,{filename}) => {

      const filePath = path.join('./recordings', filename);
      fs.unlink(filePath, (err)=> {
        if(err) {
          throw new CustomError(err.message, 500) 
        }
      })

      return {
        success: true,
        message: 'Successfully deleted'
      }
    
    }
  },
}

export default recordingsResolver

