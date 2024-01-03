
import {promises as pfs} from "fs"



let s=await pfs.readFile("../twitter/tweets.js","utf8")
let tweets=JSON.parse( s.split("window.YTD.tweets.part0 = ").join("") )

let idmap={}
let mds={}

for( let wrap of tweets )
{
	let tweet=wrap.tweet

	if( ! tweet.full_text.startsWith("RT @") ) // skip retweets
	{
		let d=new Date(tweet.created_at)
		let dd=[ d.getFullYear() , d.getMonth()+1 , d.getDate() , d.getHours() , d.getMinutes() , d.getSeconds() ]

		let unixtime=Date.UTC(dd[0],dd[1]-1,dd[2],dd[3],dd[4],dd[5])/1000
		let datedash=("0000" + dd[0]).substr(-4,4)+"-"+("00" + dd[1]).substr(-2,2)+"-"+("00" + dd[2]).substr(-2,2)
		let timecolon=("00" + dd[3]).substr(-2,2)+":"+("00" + dd[4]).substr(-2,2)+":"+("00" + dd[5]).substr(-2,2)
		let timedash=datedash+"-"+("00" + dd[3]).substr(-2,2)+("00" + dd[4]).substr(-2,2)+("00" + dd[5]).substr(-2,2)

		let text=tweet.full_text

		if(tweet.entities)
		{
			for( let media of tweet.entities.media || [] )
			{
				text=text.split(media.url).join("") // remove media
			}
			for( let link of tweet.entities.urls || [] )
			{
				text=text.split(link.url).join(link.expanded_url) // expand links
			}
		}
		
		if( tweet.in_reply_to_screen_name && tweet.in_reply_to_status_id )
		{
			text="https://twitter.com/"+tweet.in_reply_to_screen_name+"/status/"+tweet.in_reply_to_status_id+" "+text
		}
		
		idmap[ tweet.id_str ] = timedash // media map

//		console.log( timedash ,text)
		
		mds[ timedash ] = text
	}
}

let media={}
for( let file of await pfs.readdir("../twitter/tweets_media") )
{
	let t=file.split("-")[0]
	let id=idmap[t]
//	let ext=file.split(".")
//	ext=ext[ext.length-1]
	if(id)
	{
//		let year=id.substr(0,4)
		if(!media[ id ]) { media[ id ]=[] }
		media[ id ].push(file)
//		console.log(file,"micro-"+year,id+"."+ext)
	}
}
//console.log(mds)
//console.log(media)

for( let id in mds )
{
	let md=mds[id]
	let year=id.substr(0,4)
	let files={}
	let medias=media[id] || []
	for( let idx in medias )
	{
		let fn=medias[idx]
		let ext=fn.split(".")
		ext=ext[ext.length-1]

		if( medias.length>1 ) // number multiple files
		{
			files[ fn ] = id+"-"+(Number(idx)+1)+"."+ext
		}
		else
		{
			files[ fn ] = id+"."+ext
		}
	}

	let dir="../twitter-output/micro-"+year
	await pfs.mkdir( dir , { recursive: true } )

	await pfs.writeFile( dir+"/"+id+".md" , md )
	for( let src in files )
	{
		let dst=files[src]
		await pfs.copyFile( "../twitter/tweets_media/"+src , dir+"/"+dst )
	}
	console.log(id,files,md)
}

