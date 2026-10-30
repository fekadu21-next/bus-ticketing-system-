const {PrismaClient}=require("@prisma/client");
const p=new PrismaClient();
p.organizations.findMany({select:{id:true,name:true,status:true,is_active:true},orderBy:{name:"asc"}})
.then(r=>{console.log(JSON.stringify(r,null,2));return p["$disconnect"]();})
.catch(e=>{console.error(e.message);process.exit(1);});
