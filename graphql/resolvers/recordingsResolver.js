import ftp from "basic-ftp"
import fs from "fs";
import 'dotenv/config.js'
import Disposition from "../../models/disposition.js";
import CustomError from "../../middlewares/errors.js";
import path from "path";

const recordingsResolver = {
  Mutation: {
    findRecordings: async(_,{name,_id}) => {
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
        const findDispo = await Disposition.findById(_id).populate({
          path: 'customer_account',
          populate: {
            path:'bucket'
          }
        })
        const createdAt = new Date(findDispo.createdAt)
        const yearCreated = createdAt.getFullYear()
        const monthCreated = months[createdAt.getMonth()]
        const dayCreated = createdAt.getDate()
        const month = createdAt.getMonth() + 1;
        const viciIpAddress = findDispo.customer_account.bucket.viciIp
        const issabelIpAddress = findDispo.customer_account.bucket.issabelIp

        const fileNale = {
          "172.20.21.64" : "HOMECREDIT",
          "172.20.21.10" : "MIXED CAMPAIGN NEW 2",
          "172.20.21.17" : "PSBANK",
          "172.20.21.27" : "MIXED CAMPAIGN",
          "172.20.21.30" : "MCC",
          "172.20.21.35" : "MIXED CAMPAIGN",
          "172.20.21.67" : "MIXED CAMPAIGN NEW",
          '172.20.21.97' : "UB",
          '172.20.21.70' : "ATOME"
        }

        const issabelNasFileBane = {
          '172.20.21.57': "ATOME CASH S1-ISSABEL_172.20.21.57",
          "172.20.21.32" : "ATOME CASH S2-ISSABEL_172.20.21.32",
          "172.20.21.62" : "AVON-ISSABEL_172.20.21.62",
          '172.20.21.72' : "CIGNAL-ISSABEL_172.20.21.72",
          '172.20.21.50' : "CTBC-ISSABEL_172.20.21.50"
        }
          
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

        const remoteDirVici =  `/REC-${viciIpAddress}-${fileNale[viciIpAddress]}/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`     
        const remoteDirIssabel = `/ISSABEL RECORDINGS/${issabelNasFileBane[issabelIpAddress]}/${monthCreated + ' ' + yearCreated}/${checkDate(dayCreated)}`
        const localDir = './recordings'

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const ifATOME = (['CASH S2','LAZCASH S1','ACS1-TEAM 1','ACS1-TEAM 2','ACS1-TEAM 3'].includes(findDispo?.bucket?.name) && (createdAt.getMonth() < 7 && dayCreated < 18)) ? `/REC-172.20.21.18-MIXED CAMPAIGN NEW 2/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`: remoteDirVici
     
        const remoteDir = findDispo.dialer === "vici" ? ifATOME : `${remoteDirIssabel}`
        const remotePath = `${remoteDir}/${name}`;
        const localPath = `./recordings/${name}`;
        await client.downloadTo(localPath, remotePath);
        const toDownload = `http://${process.env.MY_IP}:4000/recordings/${name}`
        return {
          success: true,
          url: toDownload,
          message: "Successfully downloaded"
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

