let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.header .navbar');

menu.onclick = () =>{
   menu.classList.toggle('fa-times');
   navbar.classList.toggle('active');
};

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

function showBankForm(userId) {
    document.getElementById('registrationForm').onsubmit = function(event) {
        event.preventDefault();
        var role = document.getElementById('role').value;
        
        if (role.toLowerCase() === 'contributor') {
            // Show the bank details form for contributors
            document.querySelector('.bankdetails-form-container').style.display = 'block';
            document.querySelector('.registration-form').style.display = 'none';
        } else {
            // Proceed with form submission for non-contributors
            this.submit();
        }
    };
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

