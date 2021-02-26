const axios = require('axios')

class RealmsAPI {

    userName
    playerName
    password
    headers
    version = "1.16.5"
    slot = "3"
    authUrl = "https://authserver.mojang.com/authenticate"
    realmsUrl = "https://pc.realms.minecraft.net"
    constructor (_userName, _password){
        this.userName = _userName
        this.password = _password
    }

    async getAccessCookie (){
        try {

            let r = await axios({
                method: "post",
                url: this.authUrl,
                data: {
                    agent: {
                        name: "Minecraft",
                        version: 1
                    },
                    username: this.userName,
                    password: this.password,
                    clientToken: "client identifier",
                    requestUser: true
                }
            })

            let accessToken = r.data.accessToken

            let playerId = r.data.selectedProfile.id
            this.playerName = r.data.selectedProfile.name
            let accessCookie = "sid=token:" + accessToken + ":" + playerId + ";user=" + this.playerName + ";version=" + this.version
            this.headers = {
                Cookie: accessCookie
            }
        }
        catch (e){
            console.log(e)
            console.log("Error Getting Access Token")
        }
    }

    async getWorldId(){
        try{
            let r = await axios({
                method: "get",
                url: this.realmsUrl + "/worlds",
                headers: this.headers
            })
            
            let filter = r.data.servers.filter( (server) => {
                return server.owner === this.playerName
            })

            let id = filter[0].id

            return id

        }
        catch (e){
            console.log("Unable to get World Id")
        }
    }

    async getBackupUrl (){
        try{
            let worldId = await this.getWorldId()

            let r = await axios({
                method: "get",
                url: this.realmsUrl + "/worlds/" + worldId + "/slot/" + this.slot + "/download",
                headers: this.headers
            })
                return r.data.downloadLink
        }
        catch (e){
            if(e.response.status == 503){
                return await this.getBackupUrl()
            }
            console.log(e.response.status)
            console.log("Unable to get Backup URL")
        }
    }
}

module.exports = RealmsAPI