
let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.header .navbar');


if (menu) {
 menu.onclick = () =>{
   menu.classList.toggle('fa-times');
   navbar.classList.toggle('active');
}};

window.onscroll = () =>{
   menu.classList.remove('fa-times');
   navbar.classList.remove('active');
};

function showEditForm(productId, name, category, productImage, points) {
    document.getElementById(`edit-form-container-${productId}`).style.display = 'flex';
    document.getElementById(`update_p_id-${productId}`).value = productId;
    document.getElementById(`update_p_name-${productId}`).value = name;
    document.getElementById(`update_p_points-${productId}`).value = points;
    document.getElementById(`update_p_category-${productId}`).value = category;
    document.getElementById(`edit-preview-image-${productId}`).src = `/uploaded_img/${productImage}`;
}

function hideEditForm(productId) {
    document.getElementById(`edit-form-container-${productId}`).style.display = 'none';
    window.location.href = '/manufacturer/product';
}

function showDeleteForm(productId) {
    document.getElementById(`delete-form-container-${productId}`).style.display = 'flex';
}


function showQrCodeForm(productId, point, productName) {
    document.getElementById(`qrcode-form-container-${productId}`).style.display = 'flex';
    document.getElementById(`productName-${productId}`).value = productName;
    document.getElementById(`point-${productId}`).value = point;
}

function hideDeleteForm(productId) {
    document.getElementById(`delete-form-container-${productId}`).style.display = 'none';
    window.location.href = '/manufacturer/product';
}

function hideQrForm(productId) {
    document.getElementById(`qrcode-form-container-${productId}`).style.display = 'none';
    window.location.href = '/manufacturer/product';
}



let manufacturerPublicKey;

async function connectWallet() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Solana wallet not found. Please install Phantom.');
      return;
    }
    const response = await window.solana.connect();
    manufacturerPublicKey = response.publicKey.toString();
    console.log('Manufacturer Wallet PublicKey:', manufacturerPublicKey);
    document.getElementById('makePayment').style.display = 'block';
    document.getElementById('connectWallet').style.display = 'none';
  } catch (err) {
    console.error('Failed to connect wallet:', err);
  }
}

async function handlePaymentSubmit(event) {
  event.preventDefault();

  try {
    const data = {
      userName: document.getElementById('userName').value,
      amount: document.getElementById('amount').value,
      recipientPublicKey: document.getElementById('publicKey').value,
      manufacturerPublicKey: manufacturerPublicKey,
    };

    const transactionResponse = await axios.post('/manufacturer/makePayment', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    window.location.href = '/manufacturer/confirmPayment'
    } catch (err) {
      console.log('Payment failed:', err);
      return
    }

    //console.log('Transaction Signature:', signatureResponse.data);
}



  

document.getElementById('connectWallet').addEventListener('click', connectWallet);
//document.getElementById('makePayment').addEventListener('submit', handlePaymentSubmit);