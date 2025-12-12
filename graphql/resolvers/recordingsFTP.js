import SftpClient from "ssh2-sftp-client";
import fs from "fs";
import path from "path";
import "dotenv/config.js";
import Bucket from "../../models/bucket.js";

const REMOTE_DIR = "/var/spool/asterisk/monitorDONE/MP3";
const LOCAL_DIR = path.join(process.cwd(), "public/audio");

if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

export const recordingsFTPResolver = {
  Query: {
    recordings: async (_, { bucket, filename, limit = 10 }, { user }) => {
      const sftp = new SftpClient();

      try {
        const findBucket = await Bucket.findById(bucket);

        const password1 = ["172.20.21.15"];
        const sftpConfig = {
          // findBucket.viciIp
          host: "172.20.21.15",
          port: 22,
          username: process.env.FTP_USERNAME,
          password: password1.includes("172.20.21.15")
            ? process.env.FTP_PASSWORD2
            : process.env.FTP_PASSWORD1,
        };

        await sftp.connect(sftpConfig);

        const fileList = await sftp.list(REMOTE_DIR);

        let mp3Files = fileList.filter((f) => f.name.endsWith(".mp3"));

        mp3Files.sort((a, b) => b.modifyTime - a.modifyTime);

        const limitedFiles = mp3Files.slice(0, limit);

        for (const file of limitedFiles) {
          const remotePath = `${REMOTE_DIR}/${file.name}`;
          const localPath = path.join(LOCAL_DIR, file.name);
          if (!fs.existsSync(localPath)) {
            const wStream = fs.createWriteStream(localPath);
            const res = await sftp.get(remotePath, wStream);
          }
        }

        return limitedFiles.map((f) => ({
          name: f.name,
          url: `/audio/${f.name}`,
        }));
      } catch (err) {
        console.error("❌ SFTP Error:", err);
        return [];
      } finally {
        await sftp.end();
      }
    },
  },
};
