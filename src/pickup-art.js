/** Small, cached, original UI-quality sprites for world collectibles. */
export function pickupTexture(scene,kind,value){
 const key=`collect:${kind}:${kind==='coin'?value:''}`;if(scene.textures.exists(key))return key;
 const cv=document.createElement('canvas');cv.width=cv.height=112;const c=cv.getContext('2d');c.scale(2,2);c.translate(28,28);c.lineJoin='round';
 if(kind==='coin'){
  c.fillStyle='#725023';c.beginPath();c.arc(0,2,16,0,Math.PI*2);c.fill();
  const grad=c.createLinearGradient(0,-17,0,17);grad.addColorStop(0,'#fff3a0');grad.addColorStop(.48,'#ffcf38');grad.addColorStop(1,'#e5a527');
  c.fillStyle=grad;c.strokeStyle='#ba7b22';c.lineWidth=2;c.beginPath();c.arc(0,0,15,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#fff3a1';c.lineWidth=1.5;c.beginPath();c.arc(0,-.5,11.5,0,Math.PI*2);c.stroke();
  c.font='900 10px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#85501b';c.fillText(String(value),0,1);
 }else if(kind==='fuel'){
  c.rotate(-.1);c.fillStyle='#42372e';c.fillRect(3,-24,10,7);c.fillStyle='#b74633';c.strokeStyle='#683a2c';c.lineWidth=2.5;c.beginPath();c.roundRect(-15,-18,30,37,3);c.fill();c.stroke();
  c.fillStyle='#f06b45';c.fillRect(-12,-15,24,6);c.strokeStyle='#8b352d';c.lineWidth=3;c.beginPath();c.moveTo(-9,-6);c.lineTo(9,12);c.moveTo(9,-6);c.lineTo(-9,12);c.stroke();c.strokeStyle='#ffba70';c.lineWidth=1;c.beginPath();c.moveTo(-9,-8);c.lineTo(9,10);c.stroke();
  c.strokeStyle='#653a28';c.lineWidth=3;c.strokeRect(-10,-24,10,7);c.fillStyle='#eee0a4';c.fillRect(-11,-1,4,9);
 }else{
  c.fillStyle='#55c5e6';c.strokeStyle='#32667d';c.lineWidth=2;c.beginPath();c.moveTo(-10,-11);c.lineTo(9,-11);c.lineTo(16,-2);c.lineTo(0,17);c.lineTo(-16,-2);c.closePath();c.fill();c.stroke();c.fillStyle='#b2f5fc';c.beginPath();c.moveTo(-10,-11);c.lineTo(2,-10);c.lineTo(-5,-2);c.lineTo(-16,-2);c.closePath();c.fill();c.fillStyle='#3685b9';c.beginPath();c.moveTo(-5,-2);c.lineTo(16,-2);c.lineTo(0,17);c.closePath();c.fill();c.strokeStyle='#defbfb';c.lineWidth=1.5;c.beginPath();c.moveTo(-12,-2);c.lineTo(12,-2);c.moveTo(0,-12);c.lineTo(-5,-2);c.lineTo(0,14);c.stroke();
 }
 scene.textures.addCanvas(key,cv);return key;
}
export function drawPickups(track,min,max){
 track.pickupPool??=[];let used=0;
 for(const item of track.items){if(item.taken||item.x<min||item.x>max)continue;
  let sprite=track.pickupPool[used++];const texture=pickupTexture(track.scene,item.kind,item.value);
  if(!sprite){sprite=track.scene.add.image(0,0,texture).setDepth(6).setDisplaySize(56,56);track.pickupPool.push(sprite);}else sprite.setTexture(texture);
  sprite.setPosition(item.x,item.y+Math.sin(track.clock*.002+item.x)*2).setVisible(true);
 }
 for(let i=used;i<track.pickupPool.length;i++)track.pickupPool[i].setVisible(false);
}
