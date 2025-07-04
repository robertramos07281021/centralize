
import ftp from "basic-ftp"
import fs from "fs";
import 'dotenv/config.js'
import mongoose from "mongoose";
import Disposition from "../../models/disposition.js";
import CustomError from "../../middlewares/errors.js";


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
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const date = new Date().getDate();

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
        
        const remoteDirVici =  `/REC-${viciIpAddress}-${fileNale[viciIpAddress]}/${year}-${checkDate(month)}-${checkDate(date)}`     
        const remoteDirIssabel = `/ISSABEL RECORDINGS/ISSABEL_${issabelIpAddress}/${yearCreated}/${monthCreated + ' ' + yearCreated}/${dayCreated}`
        const localDir = '/downloads'

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const remoteDir = myDispo.dialer === "vici" ? remoteDirVici : remoteDirIssabel

        const fileList = await client.list(remoteDir);

        const files = fileList.filter(e=> contactPatterns.some(pattern => e.name.includes(pattern)))

        let numberOfFile = 1;
        function getOrdinalSuffix(n) {
          const j = n % 10,
                k = n % 100;
          if (k >= 11 && k <= 13) return n + "th";
          if (j == 1) return n + "st";
          if (j == 2) return n + "nd";
          if (j == 3) return n + "rd";
          return n + "th";
        }

        for (const file of files) { 
          
          if (file.type === ftp.FileType.File) {
            const remotePath = `${remoteDir}/${file.name}`;
            const newFileName = file.name.split('.')

            const localPath = `${localDir}/${myDispo.dispotype.code}-${newFileName[0]}-${getOrdinalSuffix(numberOfFile)}-call.wav`;
            await client.downloadTo(localPath, remotePath);   
          } else {
            throw new CustomError('No recordings found',404)
          }
          numberOfFile++;
        }

        return {
          success: true,
          message: "Successfully downloaded"
        }

      } catch (err) {
        throw new CustomError(err.message, 500)
      } finally {
        client.close();
      }
    },
  },
}

export default recordingsResolver