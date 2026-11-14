const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>[]},requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const result=vm.runInContext(`(()=>{
 const shoes=['fill','details','outline'].map(name=>({name})),shaft={name:'shaft'},mesh={name:'mesh'},edge={name:'edge'};
 const overlay={children:[...shoes,shaft,mesh,edge],querySelectorAll:()=>shoes,
 appendChild(n){this.children.splice(this.children.indexOf(n),1);this.children.push(n);},
 insertBefore(n,anchor){this.children.splice(this.children.indexOf(n),1);this.children.splice(anchor?this.children.indexOf(anchor):this.children.length,0,n);}};
 const orders=[];for(const front of [true,true,false,true,false]){updateCalfShoeOrder(overlay,front);orders.push({front,names:overlay.children.map(n=>n.name)});}
 return orders;
})()`,c);
for(const row of result){assert.equal(row.names.length,6);for(const name of ['shaft','mesh','edge'])assert.equal(row.names.indexOf('fill')>row.names.indexOf(name),row.front);assert.ok(row.names.indexOf('fill')<row.names.indexOf('outline'));}
console.log('Split-color boot foreground calves paint the foot after the shaft; repeated frames and footwear switches preserve shoe order and restore the default stack.');
