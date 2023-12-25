function showContent(id) {
    const contentDivs = document.querySelectorAll('.about');
    contentDivs.forEach(div => {
      div.style.display = 'none';
    });
  
    document.getElementById(id).style.display = 'block';
  }
  