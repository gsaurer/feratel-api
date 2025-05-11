
import axios from 'axios';

export class FeratelClientAPIWrapper {

    // Feratel Backend API configuration
    static API_BASE_URL = 'https://webclient4.deskline.net';

    constructor() {
        //const axios = require('axios');
        this.axiosInstance = axios.create({
            baseURL: FeratelClientAPIWrapper.API_BASE_URL,
            withCredentials: true, // Enable sending cookies with requests
        });

        this.cookies = []
        this.orgID = null;

        /*this.axiosInstance.interceptors.request.use(request => {
            console.log('Starting Request', request);
            return request;
        });*/

        this.axiosInstance.interceptors.response.use(response => {
            const cookies = response.headers['set-cookie'];
            this._extractCookies(cookies);
            return response;
        });
        
    }

    _extractCookies(setCookies){
        if(setCookies){
          if(Array.isArray(setCookies)){
            setCookies.forEach(setCookie=> this._extractCookie(setCookie))
          }
          else {
            this._extractCookie(setCookies)
          }
        }
      }

    
    _extractCookie(setCookie){
        var cookie = setCookie.substring(0, setCookie.indexOf(" ") - 1)
        var key = cookie.substring(0, setCookie.indexOf("="))
        var cookiesNew = []
        cookiesNew.push(cookie);
        //console.log('set-Cookies:', setCookie);

        this.cookies.forEach(cookie => {
            if(cookie.indexOf(key) < 0){
                cookiesNew.push(cookie)
                //console.log('set-Cookies:', cookie);
            }
        })

        this.cookies = cookiesNew;
    }


    // Function to login and store cookies
    async login(username, password, orgID) {
        if (orgID) {
            this.orgID = orgID;
        }
        try {
            var response = await this.axiosInstance.post('/SBG/de/account/identitylogin',
                {
                    "ReturnUrl": '',
                    "UserName": username,
                    "RememberMe": "true",
                    "Password": password,                
                },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': this.cookies,
                    },
                    withCredentials: true,
                    followRedirect: false,
                    maxRedirects: 0,
                    validateStatus: function (status) {
                        return status >= 200 && status <= 302; // default
                      }
                });
            var data = response.data;          
            return JSON.parse(JSON.stringify(data));

        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
        }
    }

    // Function to get user profile
    async getUserProfiel() {
        const response = await this.axiosInstance.get('/SBG/de/configuration/getuserprofile', {
            headers: {
                'Cookie': this.cookies,
            }
        });   
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }

    // Function to get new messages
    async getNewMessages() {
        const response = await this.axiosInstance.post('/SBG/de/messages/newmessages', 
            {},
            {
                headers: {
                    'Cookie': this.cookies,
                }
            });   
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }

    // Function to get pre check-in data
    async getPreCheckIn(checkInId) {
        const response = await this.axiosInstance.get('/SBG/de/visitorregistrationforms/getvtsheet?dbOv=MW4&masterId=' + checkInId, 
            {
                headers: {
                    'Cookie': this.cookies,
                }
            });   
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }

    // Function to approve pre check-in
    async approvePreCheckIn(checkInId) {
        var retVal = await this._convertRegistrationFormTo(checkInId, 7);
        return retVal;
    }

    async convertCheckInToRegistrationForm(checkInId) {
        var retVal = await this._convertRegistrationFormTo(checkInId, 0);
        return retVal;
    }

    async _convertRegistrationFormTo(checkInId, convertToType) {
        var preCheckInformation = await this.getPreCheckIn(checkInId);
        if (!preCheckInformation || !preCheckInformation.sheet) {
            throw new Error("Pre-check-in information not found or invalid.");  
        }
        var model = preCheckInformation.sheet;
        delete model.Summary
        delete model.GroupSubType
        delete model.HasGuestCard
        delete model.GuestSignatureType
        delete model.HasDigitalSignature
        delete model.SignatureDocuments
        delete model.ExternalRemark

        model.MasterId = checkInId
        var payload = {
            model: JSON.stringify(model)
        }
        const response = await this.axiosInstance.post('/SBG/de/visitorregistrationforms/convertto/' + 
            this.orgID + '?dbOv=MW4&masterId=' + checkInId + 
                            '&convertToType=' + convertToType +
                            '&masterSubType=0', 
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': this.cookies,
                }
            });   
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }

 

    async deleteRegistration(checkInId) {
        const response = await this.axiosInstance.post('/SBG/de/visitorregistrationforms/deletevtsheet/' + 
            this.orgID,
        {
            dbOv: 'MW4',
            masterId: checkInId,
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': this.cookies,
            }
        });   
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }


    async getGuestCardsForCheckIn(checkInId) {
        var response = await this.axiosInstance.get('SBG/de/visitorregistrationforms/getguestcards/'+ 
            this.orgID + "?dbOv=MW4&communityId=8fa86f42-603c-4486-92a2-9c733be1b2e7&"+
            "filter=%7B%22GuestName%22:%22%22,%22SearchOnlyWithEmail%22:null,%22CardNumber%22:%22%22,%22SheetNumber%22:%22%22,%22" +
            "DateFrom%22:null,%22DateTo%22:null,%22CardType%22:null,%22CardStatuses%22:null,%2" +
            "2MasterId%22:%22" + checkInId + 
            "%22%7D&itemsPerPage=10&page=1&tab=1",
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': this.cookies,
                },
            });
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }
    
    async sendGuestCardsForCheckIn(checkInId) {
        var availableGuestCards = await this.getGuestCardsForCheckIn(checkInId); 
        
        var guestCardsToCreate = []
        if (availableGuestCards && availableGuestCards.GuestCards && Array.isArray(availableGuestCards.GuestCards)) {
            availableGuestCards.GuestCards.forEach(guestCard => {
                guestCardsToCreate.push(
                    {
                        VTFormMasterId: guestCard.VTFormMasterId,
                        CardId: guestCard.Id,
                        Email: guestCard.Email,
                    });
            });
        }

        var model = {
                "type": 1,
                "templateId": "96cdbcfa-e641-499a-9fcc-010785ba9ec8",
                "email": guestCardsToCreate[0].Email,
                "guestCards": guestCardsToCreate,
        }   

        var payload = {
            model: JSON.stringify(model)
        }
        const response = await this.axiosInstance.post('SBG/de/visitorregistrationforms/sendmobileguestcards/' + 
            this.orgID + '?dbOv=MW4', 
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': this.cookies,
                }
            });   
        const data = response.data;     
        return JSON.parse(JSON.stringify(data));
    }
}
