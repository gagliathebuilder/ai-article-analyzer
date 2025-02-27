const axios = require('axios');

// The article text from the user
const articleText = `Magnite ended up with a scrappy 4% year-over-year growth rate in Q4 2024, after a sudden, unexpected drop in display and online video CPMs during November and December, which caused the company to miss its revenue guidance.
At least that's the story from Magnite's quarterly earnings report on Wednesday afternoon.
Magnite, an independent SSP, earned $194 million total in Q4 2024 and notched $36 million in profit, up from $31 million a year before.
Magnite shares dipped 6% in after-hours trading. However, the market had already priced in a drop between 10% and 20% since The Trade Desk (TTD) reported earnings earlier this month. TTD shocked the ad tech investor set by falling below its revenue guidance for the first time in … ever.

What's the deal?
Laura Martin, the tech and media analyst at Needham Bank, cut right to the chase: "Is the open internet healthy?" she asked during the call.
The top independent DSP and SSP have each reported unexpectedly poor Q4s, she said, seemingly at the expense of big platforms like Amazon that report higher growth rates on top of much larger total revenue sums.
The implication is that the "open" part of the open internet is being left far behind.
"I think it's very healthy," assured Magnite CEO Michael Barrett.
In TTD's earnings call, CEO Jeff Green attributed the miss to internal missteps at the company, as opposed to a broader indicator of the market. Magnite said the downturn was due to a stubbornly low streak of online CPMs in November and December.
CTV was relatively unaffected, he said, but display and online video CPMs crumpled after the US election. Typically, brands are crowded out by political advertisers, but then return in November and ramp up consistently through December.

"That didn't happen this year," Barrett said. Instead, food and beverage, auto, CPG, retail and other categories saw major brands hold off on recommitting major ad budgets until January.
"One can speculate why," he said. It's not even known whether the pause in demand was due to US politics, he added, "though this cratering right afterwards points to the election."
Regardless, the SSP has seen CPMs normalize since the beginning of 2025. And the recovery of CPMs from the start of January to now "gives us confidence" that the weak Q4 was just a blip.
Silver linings
When Martin of Needham asked about the health of the open internet, it wasn't just that Magnite and TTD were both down. She also specified that, as bellwether proxies for the demand side and sell side of the business, there's a new contention between the two.
TTD and Magnite are no longer clear-cut partners and allies. They are "in sort of a public war now," she joked, since leadership at both companies has begun explicitly telling investors that the other's margins are its opportunity.
TTD, for instance, has OpenPath, which it describes as a more cost-effective way for publishers to access a greater amount of Trade Desk demand. Barrett argued at length during the call that, for publishers, OpenPath doesn't put more money in their pockets – the advantages just accrue to the DSP.
He also expanded on Magnite's plan to wrest data marketplace sales from the demand side, where data has traditionally been sold, to the SSP. Magnite would make itself the storefront for retail data, for instance, Barrett said, without a swingeing markup.
He also cited the growth of the Amazon DSP as a sign of health for the open internet, in contrast to Martin's assumption that it represents primarily walled garden growth. The Amazon DSP is growing fast on Magnite's platform, he said, and they are "very intent on being the largest open internet DSP in the world."
Open internet SSPs, meanwhile, are holding the line. They still must prove the category deserves its share of the online ad pie at all.`;

async function testArticleAnalysis() {
  try {
    console.log('Sending article to API for analysis...');
    const response = await axios.post('http://localhost:5001/analyze', {
      url: articleText,
      includeEmojis: true
    });
    
    console.log('\n=== IMPROVED SUMMARY ===');
    response.data.summary.forEach((point, index) => {
      console.log(`${index + 1}. ${point}`);
    });
    
    console.log('\n=== EMAIL DRAFT ===');
    console.log(response.data.emailDraft);
    
    console.log('\n=== SOCIAL POST ===');
    console.log(response.data.socialPost);
    
    if (response.data.emojiSuggestions) {
      console.log('\n=== EMOJI SUGGESTIONS ===');
      console.log('Email:', response.data.emojiSuggestions.email.join(' '));
      console.log('Social:', response.data.emojiSuggestions.social.join(' '));
    }
  } catch (error) {
    console.error('Error testing article analysis:', error.message);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
  }
}

testArticleAnalysis(); 