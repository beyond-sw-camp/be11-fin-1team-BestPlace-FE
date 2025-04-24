<template>
    <div>
        <h1>매니저 목록</h1>
    </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
    data() {
        return{
            blockList: [],
        }
    },
    computed:{
        
          
    }
    ,
    async created(){
        
        const token = localStorage.getItem('token');
        if (token) {
            const payload = jwtDecode(token);
            this.memberId = payload.sub;
            this.userNickname = payload.nickname;
        }
        try{
            const response = await axios.get(`${process.env.VUE_APP_STREAMING_API}/member/list`)
            this.memberList = response.data;
        }catch(e){
            console.log(e)
        }
    },
    methods : {
        
    }

}
</script>
  