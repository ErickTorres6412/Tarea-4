<!-- PublisherIndex.vue -->
<template>
  <div class="row">
   <div style="margin-top: 5%">
     <h2>{{title}}</h2>
     <div v-if="message" class="notice">{{message}}</div>
     <table class="u-full-width"><thead>
       <tr>
        <th>Publisher</th>
        <th>Country</th>
        <th>Founded</th>
        <th>Genre</th>
        <th class="text-center">Actions</th>
       </tr>
       </thead><tbody>
       <tr v-for='publisher in publishers' :key="publisher.id">
       <td>{{publisher.publisher}}</td>
       <td>{{publisher.country}}</td>
       <td>{{publisher.founded}}</td>
       <td>{{publisher.genere}}</td>
       <td>
       <router-link class="button"
         :to="'/publisher/show/'+publisher.id">Show</router-link>
       &nbsp;
       <router-link class="button"
         :to="'/publisher/edit/'+publisher.id">Edit</router-link>
       &nbsp;
       <a class="button"
         v-on:click="deletePublisher(publisher.id)">Erase</a>
       </td>
       </tr></tbody>
     </table>
     <router-link class="button button-primary"
       to="/publisher/create">New</router-link>
     &nbsp;
     <a class="button" v-on:click="runTasks()">Process queue (publisherTasks)</a>
     &nbsp;
     <a class="button" v-on:click="allPublishers()">Refresh</a>
   </div>
  </div>
</template>

<script>

export default {
  name: "Publisher Index",
  data() {
    return {
      title: 'Publisher List',
      publishers: [],
      message: this.$route.query.queued ?
        'The ' + this.$route.query.queued + ' request was sent to the queue. ' +
        'It will be applied when publisherTasks is executed.' : ''
    };
  },
  mounted() {
    this.allPublishers()
  },
  methods: {
    allPublishers() {
      fetch(this.url+'/.netlify/functions/publisherFindAll',
        { headers: {'Accept': 'application/json'}})
        .then((response) => response.json())
        .then((items) => {
          this.publishers = items;
        })
     },
     deletePublisher(id) {
       fetch(this.url+'/.netlify/functions/publisherDelete/'+id,
         { headers: {'Content-Type': 'application/json'},
           method: 'DELETE'})
          .then((response) => {
            this.message = response.ok ?
              'The delete request was sent to the queue. ' +
              'It will be applied when publisherTasks is executed.' :
              'Error sending the delete request.';
            this.allPublishers();
          }
        )
     },
     runTasks() {
       fetch(this.url+'/.netlify/functions/publisherTasks')
         .then((response) => response.json())
         .then((result) => {
           this.message = 'publisherTasks processed ' + result.processed + ' message(s).';
           this.allPublishers();
         })
     }
  }
};
</script>
